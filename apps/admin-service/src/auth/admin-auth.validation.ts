import { ForbiddenException } from '@nestjs/common'

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const segments = token.split('.')
  if (segments.length !== 3) {
    throw new ForbiddenException('Authorization Bearer token is malformed')
  }

  const payloadSegment = segments[1]
  if (!payloadSegment) {
    throw new ForbiddenException('Authorization Bearer token is malformed')
  }

  try {
    const payload = Buffer.from(payloadSegment, 'base64url').toString('utf8')
    const parsed: unknown = JSON.parse(payload)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ForbiddenException('Authorization Bearer token is malformed')
    }

    return parsed as Record<string, unknown>
  } catch {
    throw new ForbiddenException('Authorization Bearer token is malformed')
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

const readCognitoGroups = (payload: Record<string, unknown>): string[] => {
  const groups = payload['cognito:groups']

  if (Array.isArray(groups)) {
    return groups.filter((group): group is string => typeof group === 'string')
  }

  if (typeof groups === 'string' && groups.length > 0) {
    return [groups]
  }

  return []
}

export const requireAdminAuthorization = (
  authorization: string | undefined
): void => {
  const token = parseBearerToken(authorization)
  if (!token) {
    throw new ForbiddenException('Admin authorization is required')
  }

  const payload = decodeJwtPayload(token)
  const groups = readCognitoGroups(payload)

  if (!groups.includes('admin')) {
    throw new ForbiddenException('Admin role is required')
  }
}

export const parseAdminUserIdFromAuthorization = (
  authorization: string | undefined
): string | undefined => {
  const token = parseBearerToken(authorization)
  if (!token) {
    return undefined
  }

  const payload = decodeJwtPayload(token)
  const preferredUsername = payload.preferred_username

  if (
    typeof preferredUsername === 'string' &&
    preferredUsername.trim().length > 0
  ) {
    return preferredUsername.trim()
  }

  return undefined
}
