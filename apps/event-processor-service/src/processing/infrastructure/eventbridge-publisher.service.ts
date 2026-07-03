import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  buildProcessedParkingEventDetail,
  createEventBridgeClient,
  publishEventBridgeEntry
} from '@polaris/eventbridge'
import type { ParkingSpotStatus } from '@polaris/shared-types'

import {
  EVENT_PROCESSOR_CONFIG_KEY,
  type EventProcessorConfig
} from '../event-processor.config.js'

export type PublishProcessedParkingEventInput = Readonly<{
  detailType: string
  eventName: string
  aggregateId: string
  occurredAt: string
  parkingSpotId: string
  previousStatus: ParkingSpotStatus
  currentStatus: ParkingSpotStatus
  userId?: string
  reservationId?: string
  vehiclePlate?: string
  deviceId?: string
  sensorType?: string
}>

export type PublishReservationEventInput = Readonly<{
  detailType: string
  eventName: string
  aggregateId: string
  occurredAt: string
  reservationId: string
  userId: string
  parkingSpotId: string
  expiresAt?: string
  reason?: string
}>

@Injectable()
export class EventBridgePublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(EventBridgePublisherService.name)
  private client: ReturnType<typeof createEventBridgeClient> | undefined

  constructor(private readonly configService: ConfigService) {}

  async onModuleDestroy(): Promise<void> {
    this.client?.destroy()
  }

  async publishProcessedParkingEvent(
    input: PublishProcessedParkingEventInput
  ): Promise<void> {
    const config = this.configService.getOrThrow<EventProcessorConfig>(
      EVENT_PROCESSOR_CONFIG_KEY
    )

    if (!config.eventBridgeEnabled) {
      return
    }

    const detail = buildProcessedParkingEventDetail(input)

    await publishEventBridgeEntry(this.getClient(config), {
      busName: config.eventBridgeBusName,
      source: config.eventBridgeSource,
      detailType: input.detailType,
      detail: { ...detail }
    })

    this.logger.debug(
      `Published ${input.detailType} for ${input.parkingSpotId} (${input.previousStatus} -> ${input.currentStatus})`
    )
  }

  async publishReservationEvent(
    input: PublishReservationEventInput
  ): Promise<void> {
    const config = this.configService.getOrThrow<EventProcessorConfig>(
      EVENT_PROCESSOR_CONFIG_KEY
    )

    if (!config.eventBridgeEnabled) {
      return
    }

    const detail: Record<string, string> = {
      eventName: input.eventName,
      aggregateId: input.aggregateId,
      occurredAt: input.occurredAt,
      processedAt: new Date().toISOString(),
      reservationId: input.reservationId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId
    }

    if (input.expiresAt) {
      detail.expiresAt = input.expiresAt
    }

    if (input.reason) {
      detail.reason = input.reason
    }

    await publishEventBridgeEntry(this.getClient(config), {
      busName: config.eventBridgeBusName,
      source: config.eventBridgeSource,
      detailType: input.detailType,
      detail
    })

    this.logger.debug(
      `Published ${input.detailType} for ${input.parkingSpotId} (${input.reservationId})`
    )
  }

  private getClient(
    config: EventProcessorConfig
  ): ReturnType<typeof createEventBridgeClient> {
    if (!this.client) {
      this.client = createEventBridgeClient({
        enabled: config.eventBridgeEnabled,
        busName: config.eventBridgeBusName,
        region: config.eventBridgeRegion,
        endpoint: config.eventBridgeEndpoint,
        source: config.eventBridgeSource
      })
    }

    return this.client
  }
}
