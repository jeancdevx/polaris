import { ConflictException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CognitoAdminService } from './cognito-admin.service.js'
import { RfidValidationStore } from './rfid-validation.store.js'
import { UsersRepository } from './users.repository.js'
import { UsersService } from './users.service.js'

const sampleRow = {
  userId: 'usr-new001',
  name: 'Jane Admin',
  email: 'jane@example.com',
  vehiclePlate: 'ABC-999',
  rfidUid: 'A1:B2:C3:D4',
  userType: 'registered' as const,
  role: 'user' as const,
  isActive: true,
  createdAt: new Date('2025-06-19T10:00:00.000Z'),
  updatedAt: new Date('2025-06-19T10:00:00.000Z')
}

describe('UsersService', () => {
  const usersRepository = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByRfidUid: vi.fn(),
    insertUserWithRfidTag: vi.fn(),
    updateUser: vi.fn(),
    deactivateUser: vi.fn()
  } as unknown as UsersRepository

  const cognitoAdminService = {
    provisionUser: vi.fn(),
    disableUser: vi.fn(),
    deleteUser: vi.fn()
  } as unknown as CognitoAdminService

  const rfidValidationStore = {
    putActiveRecord: vi.fn(),
    setActive: vi.fn()
  } as unknown as RfidValidationStore

  const service = new UsersService(
    usersRepository,
    cognitoAdminService,
    rfidValidationStore
  )

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('creates a user in Cognito, RDS and DynamoDB', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null)
    vi.mocked(usersRepository.findByRfidUid).mockResolvedValue(null)
    vi.mocked(usersRepository.insertUserWithRfidTag).mockResolvedValue(
      sampleRow
    )

    const result = await service.create({
      name: 'Jane Admin',
      email: 'jane@example.com',
      vehiclePlate: 'ABC-999',
      rfidUid: 'A1:B2:C3:D4',
      userType: 'registered',
      role: 'user',
      password: 'PolarisTest1!'
    })

    expect(cognitoAdminService.provisionUser).toHaveBeenCalledOnce()
    expect(usersRepository.insertUserWithRfidTag).toHaveBeenCalledOnce()
    expect(rfidValidationStore.putActiveRecord).toHaveBeenCalledOnce()
    expect(result.userId).toBe('usr-new001')
    expect(result.temporaryPassword).toBeUndefined()
  })

  it('rejects duplicate email', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(sampleRow)
    vi.mocked(usersRepository.findByRfidUid).mockResolvedValue(null)

    await expect(
      service.create({
        name: 'Jane Admin',
        email: 'jane@example.com',
        vehiclePlate: 'ABC-999',
        rfidUid: 'A1:B2:C3:D4',
        userType: 'registered',
        role: 'user'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('throws when user is missing', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null)

    await expect(service.getById('usr-missing')).rejects.toBeInstanceOf(
      NotFoundException
    )
  })
})
