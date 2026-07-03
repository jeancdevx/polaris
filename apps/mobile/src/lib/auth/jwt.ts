import { decodeBase64Url } from '@/lib/encoding/base64'

export type JwtClaims = Readonly<{
  userId?: string
  email?: string
  expiresAtMs?: number
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const decodeJwtClaims = (token: string): JwtClaims => {
  const payloadSegment = token.split('.')[1]

  if (!payloadSegment) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payloadSegment))

    if (!isRecord(parsed)) {
      return {}
    }

    return {
      userId:
        typeof parsed.preferred_username === 'string'
          ? parsed.preferred_username
          : undefined,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      expiresAtMs:
        typeof parsed.exp === 'number' ? parsed.exp * 1000 : undefined
    }
  } catch {
    return {}
  }
}

export const isJwtExpired = (
  token: string,
  skewMs = 60_000,
  now = Date.now()
): boolean => {
  const { expiresAtMs } = decodeJwtClaims(token)

  if (!expiresAtMs) {
    return true
  }

  return now >= expiresAtMs - skewMs
}
