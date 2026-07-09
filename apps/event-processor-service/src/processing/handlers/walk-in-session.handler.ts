import { Injectable, Logger } from '@nestjs/common'

import type { RfidValidationEvent } from '@polaris/kafka'

import { AuditLogRepository } from '../infrastructure/audit-log.repository.js'

@Injectable()
export class WalkInSessionHandler {
  private readonly logger = new Logger(WalkInSessionHandler.name)

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async handle(event: RfidValidationEvent): Promise<void> {
    const eventType =
      event.readerLocation === 'entry' ? 'walk_in_entry' : 'walk_in_exit'

    await this.auditLogRepository.insert({
      eventType,
      userId: event.userId,
      userType: event.userType === 'visitor' ? 'visitor' : 'registered',
      vehiclePlate: event.vehiclePlate,
      gate: event.readerLocation,
      metadata: {
        rfidUid: event.rfidUid,
        sessionId: event.sessionId,
        deviceId: event.deviceId
      },
      timestamp: new Date(event.occurredAt)
    })

    this.logger.log(
      `Walk-in ${event.readerLocation} recorded for ${event.rfidUid} (session ${event.sessionId ?? 'unknown'})`
    )
  }
}
