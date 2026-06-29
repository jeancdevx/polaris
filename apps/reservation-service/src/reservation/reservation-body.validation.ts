import { BadRequestException } from '@nestjs/common'

export type CreateReserveBody = {
  parkingSpotId: string
  reservationDate: string
}

const readObjectBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Request body must be a JSON object')
  }

  return body as Record<string, unknown>
}

const readStringField = (
  body: Record<string, unknown>,
  field: string
): string => {
  const value = body[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} is required`)
  }

  return value.trim()
}

export const parseCreateReserveBody = (body: unknown): CreateReserveBody => {
  const record = readObjectBody(body)
  const parkingSpotId = readStringField(record, 'parkingSpotId').toLowerCase()
  const reservationDate = readStringField(record, 'reservationDate')
  const parsed = new Date(reservationDate)

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      'reservationDate must be a valid ISO-8601 timestamp'
    )
  }

  return {
    parkingSpotId,
    reservationDate: parsed.toISOString()
  }
}

export const parseUserIdHeader = (userId: string | undefined): string => {
  if (!userId?.trim()) {
    throw new BadRequestException('X-User-Id header is required')
  }

  return userId.trim()
}

export const parseReservationIdParam = (reservationId: string): string => {
  if (!reservationId.trim()) {
    throw new BadRequestException('reservation id is required')
  }

  return reservationId.trim()
}
