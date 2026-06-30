export type NotificationEvent = Readonly<{
  detailType: string
  source: string
  aggregateId: string
  reservationId: string
  userId: string
  parkingSpotId: string
  reason?: string
  expiresAt?: string
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const readDetail = (detail: unknown): Record<string, unknown> => {
  if (typeof detail === 'string') {
    return JSON.parse(detail) as Record<string, unknown>
  }

  if (isRecord(detail)) {
    return detail
  }

  return {}
}

export const parseNotificationEvent = (raw: unknown): NotificationEvent => {
  if (!isRecord(raw)) {
    throw new Error('Notification event must be an object')
  }

  const detailType =
    typeof raw['detail-type'] === 'string'
      ? raw['detail-type']
      : typeof raw.detailType === 'string'
        ? raw.detailType
        : undefined

  const source = typeof raw.source === 'string' ? raw.source : 'unknown'
  const detail = readDetail(raw.detail ?? raw)

  const reservationId =
    readString(detail, 'reservationId') ?? readString(detail, 'aggregateId')
  const userId = readString(detail, 'userId')
  const parkingSpotId = readString(detail, 'parkingSpotId')
  const reason = readString(detail, 'reason')
  const expiresAt = readString(detail, 'expiresAt')

  if (!detailType) {
    throw new Error('detail-type is required')
  }

  if (!reservationId || !userId || !parkingSpotId) {
    throw new Error('reservationId, userId and parkingSpotId are required')
  }

  return {
    detailType,
    source,
    aggregateId: reservationId,
    reservationId,
    userId,
    parkingSpotId,
    reason,
    expiresAt
  }
}

export const buildNotificationMessage = (event: NotificationEvent): string => {
  const spotLabel = event.parkingSpotId.replace(/^spot-/i, 'Plaza ')

  if (event.detailType === 'reservation.created') {
    return `Reserva confirmada - ${spotLabel}`
  }

  if (event.reason === 'expired') {
    return `Tu reserva de la ${spotLabel} ha expirado`
  }

  if (event.detailType === 'reservation.cancelled') {
    return `Reserva cancelada - ${spotLabel}`
  }

  return `Notificación Polaris: ${event.detailType}`
}
