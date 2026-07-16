import type { AuditLogRow } from '@polaris/database'
import type { AuditLog } from '@polaris/shared-types'

const toIsoTimestamp = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? new Date(0).toISOString()
    : parsed.toISOString()
}

export const mapAuditLogRow = (row: AuditLogRow): AuditLog => ({
  logId: row.logId,
  eventType: row.eventType,
  userId: row.userId,
  userType: row.userType,
  vehiclePlate: row.vehiclePlate,
  parkingSpotId: row.parkingSpotId,
  gate: row.gate,
  timestamp: toIsoTimestamp(row.timestamp),
  metadata: row.metadata
})
