import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  cancelReservation,
  createReservation,
  createReservationId,
  createSpotId,
  createUserId,
  isBusinessRuleViolationError,
  isInvalidValueError,
  restoreReservation
} from '@polaris/domain'
import type { Reservation as ReservationDto } from '@polaris/shared-types'
import type { PolarisRedisClient } from '@polaris/shared-utils'

import { RedisService } from './redis.service.js'
import type { CreateReserveBody } from './reservation-body.validation.js'
import { ReservationEventPublisher } from './reservation-event.publisher.js'
import { generateReservationId } from './reservation-id.js'
import {
  RESERVATION_CONFIG_KEY,
  type ReservationConfig
} from './reservation.config.js'
import {
  PARKING_LOCK_KEY_PREFIX,
  PARKING_SPOT_KEY_PREFIX,
  PARKING_STATS_KEYS
} from './reservation.constants.js'
import { mapReservationRow } from './reservation.mapper.js'
import { ReservationRepository } from './reservation.repository.js'

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly reservationRepository: ReservationRepository,
    private readonly reservationEventPublisher: ReservationEventPublisher
  ) {}

  async create(
    userId: string,
    body: CreateReserveBody
  ): Promise<ReservationDto> {
    try {
      const config = this.configService.getOrThrow<ReservationConfig>(
        RESERVATION_CONFIG_KEY
      )
      const spotId = createSpotId(body.parkingSpotId)
      const user = createUserId(userId)
      const reservationDate = new Date(body.reservationDate)
      const createdAt = new Date()
      const expiresAt = new Date(
        reservationDate.getTime() + config.reservationDurationMs
      )

      const client = await this.redisService.getClient()
      const lockKey = `${PARKING_LOCK_KEY_PREFIX}${spotId.value}`
      const lockAcquired = await client.set(lockKey, userId, {
        NX: true,
        EX: config.lockTtlSeconds
      })

      if (!lockAcquired) {
        throw new ConflictException('Parking spot is not available')
      }

      try {
        await this.assertRedisSpotIsFree(client, spotId.value)

        const reservation = createReservation({
          reservationId: generateReservationId(),
          userId: user,
          parkingSpotId: spotId,
          reservationDate,
          expiresAt,
          createdAt
        })

        const row =
          await this.reservationRepository.insertActiveReservation(reservation)

        await this.markSpotReservedInRedis(
          client,
          spotId.value,
          userId,
          row.reservationId
        )

        this.logger.log(
          `Reservation ${row.reservationId} created for spot ${spotId.value}`
        )

        const reservationDto = mapReservationRow(row)
        await this.reservationEventPublisher.publishCreated(reservationDto)

        return reservationDto
      } finally {
        await client.del(lockKey)
      }
    } catch (error) {
      throw this.mapDomainError(error)
    }
  }

  async cancel(
    userId: string,
    reservationIdValue: string
  ): Promise<ReservationDto> {
    try {
      const reservationId = createReservationId(reservationIdValue)
      const row = await this.reservationRepository.findById(reservationId.value)

      if (!row) {
        throw new NotFoundException(
          `Reservation ${reservationId.value} was not found`
        )
      }

      if (row.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to cancel this reservation'
        )
      }

      const domainReservation = restoreReservation({
        reservationId: createReservationId(row.reservationId),
        userId: createUserId(row.userId),
        parkingSpotId: createSpotId(row.parkingSpotId),
        status: row.status,
        reservationDate: row.reservationDate,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        checkedInAt: row.checkedInAt,
        checkedOutAt: row.checkedOutAt,
        cancelledAt: row.cancelledAt,
        expiredAt: row.expiredAt
      })

      const cancelledAt = new Date()
      const cancelled = cancelReservation(domainReservation, cancelledAt)
      const updatedRow =
        await this.reservationRepository.persistCancellation(cancelled)

      const client = await this.redisService.getClient()
      await this.markSpotFreeInRedis(client, updatedRow.parkingSpotId)

      this.logger.log(`Reservation ${updatedRow.reservationId} cancelled`)

      const reservationDto = mapReservationRow(updatedRow)
      await this.reservationEventPublisher.publishCancelled(reservationDto)

      return reservationDto
    } catch (error) {
      throw this.mapDomainError(error)
    }
  }

  private async assertRedisSpotIsFree(
    client: PolarisRedisClient,
    spotId: string
  ): Promise<void> {
    const status = await client.hGet(
      `${PARKING_SPOT_KEY_PREFIX}${spotId}`,
      'status'
    )

    if (status && status !== 'free') {
      throw new ConflictException('Parking spot is not available')
    }
  }

  private async markSpotReservedInRedis(
    client: PolarisRedisClient,
    spotId: string,
    userId: string,
    reservationId: string
  ): Promise<void> {
    const spotKey = `${PARKING_SPOT_KEY_PREFIX}${spotId}`

    await client
      .multi()
      .hSet(spotKey, {
        status: 'reserved',
        userId,
        reservationId
      })
      .decr(PARKING_STATS_KEYS.totalAvailable)
      .incr(PARKING_STATS_KEYS.totalReserved)
      .exec()
  }

  private async markSpotFreeInRedis(
    client: PolarisRedisClient,
    spotId: string
  ): Promise<void> {
    const spotKey = `${PARKING_SPOT_KEY_PREFIX}${spotId}`

    await client
      .multi()
      .hSet(spotKey, { status: 'free' })
      .hDel(spotKey, ['userId', 'reservationId'])
      .decr(PARKING_STATS_KEYS.totalReserved)
      .incr(PARKING_STATS_KEYS.totalAvailable)
      .exec()
  }

  private mapDomainError(error: unknown): unknown {
    if (isInvalidValueError(error)) {
      return new BadRequestException(error.message)
    }

    if (isBusinessRuleViolationError(error)) {
      if (
        error.code === 'SPOT_NOT_AVAILABLE' ||
        error.code === 'RESERVATION_NOT_CANCELLABLE'
      ) {
        return new ConflictException(error.message)
      }

      if (error.code === 'RESERVATION_NOT_FOUND') {
        return new NotFoundException(error.message)
      }
    }

    return error
  }
}
