import { BadRequestException } from '@nestjs/common'

import type {
  LogoutBody,
  RefreshBody,
  SigninBody,
  SignupBody
} from './types/auth.types.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const readObjectBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Request body must be a JSON object')
  }

  return body as Record<string, unknown>
}

export const parseSignupBody = (body: unknown): SignupBody => {
  const record = readObjectBody(body)
  const email = readStringField(record, 'email').toLowerCase()
  const password = readStringField(record, 'password')

  if (!EMAIL_PATTERN.test(email)) {
    throw new BadRequestException('email must be a valid email address')
  }

  return { email, password }
}

export const parseSigninBody = (body: unknown): SigninBody => {
  const record = readObjectBody(body)
  const email = readStringField(record, 'email').toLowerCase()
  const password = readStringField(record, 'password')

  return { email, password }
}

export const parseRefreshBody = (body: unknown): RefreshBody => {
  const record = readObjectBody(body)
  const refreshToken = readStringField(record, 'refreshToken')

  return { refreshToken }
}

export const parseLogoutBody = (body: unknown): LogoutBody => {
  if (body === undefined || body === null) {
    return {}
  }

  const record = readObjectBody(body)

  if (record.accessToken === undefined) {
    return {}
  }

  return {
    accessToken: readStringField(record, 'accessToken')
  }
}

export const parseBearerAccessToken = (
  authorizationHeader: string | undefined
): string | undefined => {
  if (!authorizationHeader) {
    return undefined
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new BadRequestException('Authorization header must use Bearer scheme')
  }

  return token
}
