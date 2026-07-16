import { randomUUID } from 'node:crypto'

import { Injectable, Logger } from '@nestjs/common'

import type { RfidValidationEvent } from '@polaris/kafka'

import { AuditLogRepository } from '../infrastructure/audit-log.repository.js'
import { insertAuditLogSafe } from '../infrastructure/audit-log.safe.js'
import { VehicleEntryHandler } from './vehicle-entry.handler.js'
import { VehicleExitHandler } from './vehicle-exit.handler.js'
import { WalkInSessionHandler } from './walk-in-session.handler.js'

@Injectable()
export class RfidValidationHandler {
  private readonly logger = new Logger(RfidValidationHandler.name)

  constructor(
    private readonly vehicleEntryHandler: VehicleEntryHandler,
    private readonly vehicleExitHandler: VehicleExitHandler,
    private readonly walkInSessionHandler: WalkInSessionHandler,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async handle(event: RfidValidationEvent): Promise<void> {
    if (!event.valid) {
      this.logger.debug(
        `RFID validation denied (${event.readerLocation}): ${event.reason ?? 'unknown'}`
      )
      await insertAuditLogSafe(this.auditLogRepository, {
        eventType: 'rfid_denied',
        userId: event.userId,
        userType:
          event.userType === 'visitor'
            ? 'visitor'
            : event.userType === 'registered'
              ? 'registered'
              : undefined,
        vehiclePlate: event.vehiclePlate,
        parkingSpotId: event.parkingSpotId,
        gate: event.readerLocation,
        metadata: {
          rfidUid: event.rfidUid,
          deviceId: event.deviceId,
          reason: event.reason
        },
        timestamp: new Date(event.occurredAt)
      })
      return
    }

    const accessType =
      event.accessType ?? (event.parkingSpotId ? 'reserved' : 'walk_in')

    if (accessType === 'walk_in') {
      await this.walkInSessionHandler.handle(event)
      return
    }

    if (!event.userId || !event.parkingSpotId) {
      this.logger.warn(
        `RFID validation missing userId or parkingSpotId for ${event.rfidUid}`
      )
      return
    }

    const vehiclePlate = event.vehiclePlate ?? 'RFID'

    if (event.readerLocation === 'entry') {
      await this.vehicleEntryHandler.handle({
        eventName: 'vehicle.entry',
        aggregateId: randomUUID(),
        occurredAt: event.occurredAt,
        eventId: randomUUID(),
        userId: event.userId,
        parkingSpotId: event.parkingSpotId,
        vehiclePlate,
        reservationId: event.reservationId,
        gate: 'entry'
      })
      return
    }

    await this.vehicleExitHandler.handle({
      eventName: 'vehicle.exit',
      aggregateId: randomUUID(),
      occurredAt: event.occurredAt,
      eventId: randomUUID(),
      userId: event.userId,
      parkingSpotId: event.parkingSpotId,
      vehiclePlate,
      reservationId: event.reservationId,
      gate: 'exit'
    })
  }
}
