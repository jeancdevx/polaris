import type { AuditLogRow } from '@polaris/database'
import type { AuditLog } from '@polaris/shared-types'

export const mapAuditLogRow = (row: AuditLogRow): AuditLog => ({
  logId: row.logId,
  eventType: row.eventType,
  userId: row.userId,
  userType: row.userType,
  vehiclePlate: row.vehiclePlate,
  parkingSpotId: row.parkingSpotId,
  gate: row.gate,
  timestamp: row.timestamp.toISOString(),
  metadata: row.metadata
})
