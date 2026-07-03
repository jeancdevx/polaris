import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'

import {
  createEmail,
  createRfidTag,
  createRfidUid,
  createUser,
  createUserId,
  createVehiclePlate,
  updateUserProfile
} from '@polaris/domain'

import { CognitoAdminService } from './cognito-admin.service.js'
import { RfidValidationStore } from './rfid-validation.store.js'
import { generateTemporaryPassword, generateUserId } from './user-id.js'
import type {
  CreateAdminUserBody,
  UpdateAdminUserBody
} from './users-body.validation.js'
import { mapUserRowToResponse } from './users.mapper.js'
import { UsersRepository } from './users.repository.js'
import type {
  AdminUserListResponse,
  AdminUserResponse,
  CreateAdminUserResponse
} from './users.types.js'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cognitoAdminService: CognitoAdminService,
    private readonly rfidValidationStore: RfidValidationStore
  ) {}

  async list(includeInactive: boolean): Promise<AdminUserListResponse> {
    const rows = await this.usersRepository.findAll(includeInactive)

    return {
      users: rows.map(mapUserRowToResponse),
      total: rows.length
    }
  }

  async getById(userId: string): Promise<AdminUserResponse> {
    const row = await this.usersRepository.findById(userId)

    if (!row) {
      throw new NotFoundException(`User ${userId} was not found`)
    }

    return mapUserRowToResponse(row)
  }

  async create(body: CreateAdminUserBody): Promise<CreateAdminUserResponse> {
    await this.assertUniqueIdentity(body.email, body.rfidUid)

    const userId = generateUserId()
    const password = body.password ?? generateTemporaryPassword()
    let cognitoCreated = false

    try {
      await this.cognitoAdminService.provisionUser({
        email: body.email,
        userId: userId.value,
        role: body.role,
        password
      })
      cognitoCreated = true

      const domainUser = createUser({
        userId,
        name: body.name,
        email: createEmail(body.email),
        vehiclePlate: createVehiclePlate(body.vehiclePlate),
        rfidUid: createRfidUid(body.rfidUid),
        userType: body.userType
      })

      const row = await this.usersRepository.insertUserWithRfidTag({
        userId: domainUser.userId.value,
        name: domainUser.name,
        email: domainUser.email.value,
        vehiclePlate: domainUser.vehiclePlate.value,
        rfidUid: domainUser.rfidUid.value,
        userType: body.userType,
        role: body.role
      })

      const rfidTag = createRfidTag({
        rfidUid: domainUser.rfidUid,
        userId: domainUser.userId,
        vehiclePlate: domainUser.vehiclePlate,
        userType: body.userType
      })

      await this.rfidValidationStore.putActiveRecord({
        rfidUid: rfidTag.rfidUid.value,
        userId: rfidTag.userId.value,
        userType: rfidTag.userType,
        vehiclePlate: rfidTag.vehiclePlate.value,
        isActive: true
      })

      return {
        ...mapUserRowToResponse(row),
        temporaryPassword: body.password ? undefined : password
      }
    } catch (error) {
      if (cognitoCreated) {
        await this.cognitoAdminService
          .deleteUser(body.email)
          .catch(cleanupError => {
            this.logger.error(
              `Failed to rollback Cognito user ${body.email}`,
              cleanupError
            )
          })
      }

      throw error
    }
  }

  async update(
    userId: string,
    body: UpdateAdminUserBody
  ): Promise<AdminUserResponse> {
    const existing = await this.usersRepository.findById(userId)

    if (!existing) {
      throw new NotFoundException(`User ${userId} was not found`)
    }

    const domainUser = createUser({
      userId: createUserId(existing.userId),
      name: existing.name,
      email: createEmail(existing.email),
      vehiclePlate: createVehiclePlate(existing.vehiclePlate),
      rfidUid: createRfidUid(existing.rfidUid),
      userType: existing.userType,
      createdAt: existing.createdAt
    })

    const updatedProfile =
      body.name !== undefined || body.vehiclePlate !== undefined
        ? updateUserProfile(
            domainUser,
            body.name ?? existing.name,
            createVehiclePlate(body.vehiclePlate ?? existing.vehiclePlate)
          )
        : domainUser

    const row = await this.usersRepository.updateUser(userId, {
      name: updatedProfile.name,
      vehiclePlate: updatedProfile.vehiclePlate.value,
      userType: body.userType,
      role: body.role,
      isActive: body.isActive
    })

    if (!row) {
      throw new NotFoundException(`User ${userId} was not found`)
    }

    await this.rfidValidationStore.setActive(row.rfidUid, row.isActive)

    return mapUserRowToResponse(row)
  }

  async remove(userId: string): Promise<AdminUserResponse> {
    const existing = await this.usersRepository.findById(userId)

    if (!existing) {
      throw new NotFoundException(`User ${userId} was not found`)
    }

    const row = await this.usersRepository.deactivateUser(userId)

    if (!row) {
      throw new NotFoundException(`User ${userId} was not found`)
    }

    await this.cognitoAdminService.disableUser(existing.email)
    await this.rfidValidationStore.setActive(row.rfidUid, false)

    return mapUserRowToResponse(row)
  }

  private async assertUniqueIdentity(
    email: string,
    rfidUid: string
  ): Promise<void> {
    const [existingEmail, existingRfid] = await Promise.all([
      this.usersRepository.findByEmail(email),
      this.usersRepository.findByRfidUid(rfidUid)
    ])

    if (existingEmail) {
      throw new ConflictException(`Email ${email} is already registered`)
    }

    if (existingRfid) {
      throw new ConflictException(`RFID ${rfidUid} is already assigned`)
    }
  }
}
