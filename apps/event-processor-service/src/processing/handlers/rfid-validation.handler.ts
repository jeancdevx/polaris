import { randomUUID } from 'node:crypto'

import { Injectable, Logger } from '@nestjs/common'

import type { RfidValidationEvent } from '@polaris/kafka'

import { VehicleEntryHandler } from './vehicle-entry.handler.js'
import { VehicleExitHandler } from './vehicle-exit.handler.js'

@Injectable()
export class RfidValidationHandler {
  private readonly logger = new Logger(RfidValidationHandler.name)

  constructor(
    private readonly vehicleEntryHandler: VehicleEntryHandler,
    private readonly vehicleExitHandler: VehicleExitHandler
  ) {}

  async handle(event: RfidValidationEvent): Promise<void> {
    if (!event.valid) {
      this.logger.debug(
        `RFID validation denied (${event.readerLocation}): ${event.reason ?? 'unknown'}`
      )
      return
    }

    if (!event.userId || !event.parkingSpotId) {
      this.logger.warn(
        `RFID validation missing userId or parkingSpotId for ${event.rfidUid}`
      )
      return
    }

    if (event.readerLocation === 'entry') {
      await this.vehicleEntryHandler.handle({
        eventName: 'vehicle.entry',
        aggregateId: randomUUID(),
        occurredAt: event.occurredAt,
        eventId: randomUUID(),
        userId: event.userId,
        parkingSpotId: event.parkingSpotId,
        vehiclePlate: 'RFID',
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
      vehiclePlate: 'RFID',
      reservationId: event.reservationId,
      gate: 'exit'
    })
  }
}
