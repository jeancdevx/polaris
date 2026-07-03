import type { AuditLog } from '@polaris/shared-types'

import { listAuditLogs } from '@/lib/admin/audit-api'

export const OPERATIONAL_ALERT_TYPES = [
  'anomaly_unregistered_occupancy',
  'passage_stalled',
  'exit_barrier_timeout'
] as const

export type OperationalAlertType = (typeof OPERATIONAL_ALERT_TYPES)[number]

const alertTypeSet = new Set<string>(OPERATIONAL_ALERT_TYPES)

export const isOperationalAlert = (eventType: string): boolean =>
  alertTypeSet.has(eventType)

export const alertTypeLabel: Record<OperationalAlertType, string> = {
  anomaly_unregistered_occupancy: 'Ocupación sin ingreso',
  passage_stalled: 'Vehículo estancado en entrada',
  exit_barrier_timeout: 'Barrera de salida abierta demasiado tiempo'
}

export const loadOperationalAlerts = async (
  limit = 50
): Promise<AuditLog[]> => {
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const response = await listAuditLogs({ page: 1, limit: 100, from })

  return response.items
    .filter(item => isOperationalAlert(item.eventType))
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .slice(0, limit)
}

export const loadActiveAnomalySpotIds = async (): Promise<Set<string>> => {
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const response = await listAuditLogs({
    page: 1,
    limit: 100,
    eventType: 'anomaly_unregistered_occupancy',
    from
  })

  const spotIds = response.items
    .map(item => item.parkingSpotId)
    .filter((spotId): spotId is string => Boolean(spotId))

  return new Set(spotIds)
}
