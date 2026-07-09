import { Injectable, Logger } from '@nestjs/common'

import type { EntryProximityTelemetryEvent } from '@polaris/kafka'

import { AuditLogRepository } from '../infrastructure/audit-log.repository.js'

const OPERATIONAL_ALERT_EVENTS = new Set([
  'passage_stalled',
  'exit_barrier_timeout'
])

@Injectable()
export class EntryProximityHandler {
  private readonly logger = new Logger(EntryProximityHandler.name)

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async handle(event: EntryProximityTelemetryEvent): Promise<void> {
    if (!OPERATIONAL_ALERT_EVENTS.has(event.event)) {
      return
    }

    await this.auditLogRepository.insert({
      eventType: event.event,
      gate: event.event === 'exit_barrier_timeout' ? 'exit' : 'entry',
      metadata: {
        deviceId: event.deviceId,
        ...(event.distanceCm !== undefined
          ? { distanceCm: event.distanceCm }
          : {}),
        ...(event.gateState !== undefined ? { gateState: event.gateState } : {})
      },
      timestamp: new Date(event.occurredAt)
    })

    this.logger.warn(
      `Operational alert recorded: ${event.event} (${event.deviceId})`
    )
  }
}
