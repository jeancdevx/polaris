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

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const segments = token.split('.')
  if (segments.length !== 3) {
    throw new BadRequestException('Authorization Bearer token is malformed')
  }

  const payloadSegment = segments[1]
  if (!payloadSegment) {
    throw new BadRequestException('Authorization Bearer token is malformed')
  }

  try {
    const payload = Buffer.from(payloadSegment, 'base64url').toString('utf8')
    const parsed: unknown = JSON.parse(payload)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('Authorization Bearer token is malformed')
    }

    return parsed as Record<string, unknown>
  } catch {
    throw new BadRequestException('Authorization Bearer token is malformed')
  }
}

const parseBearerToken = (
  authorization: string | undefined
): string | undefined => {
  if (!authorization?.trim()) {
    return undefined
  }

  const [scheme, token] = authorization.trim().split(/\s+/, 2)
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined
  }

  return token
}

export const parseUserIdFromJwt = (
  authorization: string | undefined
): string | undefined => {
  const token = parseBearerToken(authorization)
  if (!token) {
    return undefined
  }

  const payload = decodeJwtPayload(token)
  const preferredUsername = payload.preferred_username
  if (
    typeof preferredUsername !== 'string' ||
    preferredUsername.trim().length === 0
  ) {
    return undefined
  }

  return preferredUsername.trim()
}

export const parseUserIdHeader = (userId: string | undefined): string => {
  if (!userId?.trim()) {
    throw new BadRequestException('X-User-Id header is required')
  }

  return userId.trim()
}

export const parseUserIdentity = (
  userIdHeader: string | undefined,
  authorization: string | undefined
): string => {
  const fromJwt = parseUserIdFromJwt(authorization)
  if (fromJwt) {
    return fromJwt
  }

  if (userIdHeader?.trim()) {
    return userIdHeader.trim()
  }

  throw new BadRequestException('X-User-Id header is required')
}

export const parseReservationIdParam = (reservationId: string): string => {
  if (!reservationId.trim()) {
    throw new BadRequestException('reservation id is required')
  }

  return reservationId.trim()
}
