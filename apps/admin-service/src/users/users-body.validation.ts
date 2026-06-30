import { BadRequestException } from '@nestjs/common'

import type { UserRole } from '@polaris/database'
import type { UserType } from '@polaris/shared-types'
import { isValidEmail, isValidRfidUid } from '@polaris/shared-utils'

export type CreateAdminUserBody = Readonly<{
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: UserRole
  password?: string
}>

export type UpdateAdminUserBody = Readonly<{
  name?: string
  vehiclePlate?: string
  userType?: UserType
  role?: UserRole
  isActive?: boolean
}>

const readObjectBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Request body must be a JSON object')
  }

  return body as Record<string, unknown>
}

const readStringField = (
  body: Record<string, unknown>,
  field: string,
  required = true
): string | undefined => {
  const value = body[field]

  if (value === undefined || value === null) {
    if (!required) {
      return undefined
    }

    throw new BadRequestException(`${field} is required`)
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string`)
  }

  return value.trim()
}

const readUserType = (
  body: Record<string, unknown>,
  required: boolean
): UserType | undefined => {
  const value = readStringField(body, 'userType', required)?.toLowerCase()

  if (!value) {
    return undefined
  }

  if (value !== 'registered' && value !== 'visitor') {
    throw new BadRequestException('userType must be registered or visitor')
  }

  return value
}

const readRole = (
  body: Record<string, unknown>,
  required: boolean
): UserRole | undefined => {
  const value = readStringField(body, 'role', required)?.toLowerCase()

  if (!value) {
    return undefined
  }

  if (value !== 'user' && value !== 'admin') {
    throw new BadRequestException('role must be user or admin')
  }

  return value
}

const normalizeVehiclePlate = (value: string): string => value.toUpperCase()

const normalizeRfidUid = (value: string): string => {
  const normalized = value.trim().toUpperCase()

  if (!isValidRfidUid(normalized)) {
    throw new BadRequestException('rfidUid format is invalid')
  }

  return normalized
}

const normalizeEmail = (value: string): string => {
  const normalized = value.trim().toLowerCase()

  if (!isValidEmail(normalized)) {
    throw new BadRequestException('email format is invalid')
  }

  return normalized
}

export const parseCreateAdminUserBody = (
  body: unknown
): CreateAdminUserBody => {
  const record = readObjectBody(body)
  const password = readStringField(record, 'password', false)

  return {
    name: readStringField(record, 'name')!,
    email: normalizeEmail(readStringField(record, 'email')!),
    vehiclePlate: normalizeVehiclePlate(
      readStringField(record, 'vehiclePlate')!
    ),
    rfidUid: normalizeRfidUid(readStringField(record, 'rfidUid')!),
    userType: readUserType(record, false) ?? 'registered',
    role: readRole(record, false) ?? 'user',
    password
  }
}

export const parseUpdateAdminUserBody = (
  body: unknown
): UpdateAdminUserBody => {
  const record = readObjectBody(body)

  if (
    record.name === undefined &&
    record.vehiclePlate === undefined &&
    record.userType === undefined &&
    record.role === undefined &&
    record.isActive === undefined
  ) {
    throw new BadRequestException('At least one field must be provided')
  }

  const vehiclePlate = readStringField(record, 'vehiclePlate', false)
  const isActive = record.isActive

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw new BadRequestException('isActive must be a boolean')
  }

  return {
    name: readStringField(record, 'name', false),
    vehiclePlate: vehiclePlate
      ? normalizeVehiclePlate(vehiclePlate)
      : undefined,
    userType: readUserType(record, false),
    role: readRole(record, false),
    isActive
  }
}

export const parseUserIdParam = (userId: string): string => {
  if (!userId.trim()) {
    throw new BadRequestException('user id is required')
  }

  return userId.trim()
}

export const parseIncludeInactiveQuery = (value: string | undefined): boolean =>
  value === 'true' || value === '1'
