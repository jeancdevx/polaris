import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'

import { requireAdminAuthorization } from '../auth/admin-auth.validation.js'
import {
  parseCreateAdminUserBody,
  parseIncludeInactiveQuery,
  parseUpdateAdminUserBody,
  parseUserIdParam
} from './users-body.validation.js'
import { UsersService } from './users.service.js'
import type {
  AdminUserListResponse,
  AdminUserResponse,
  CreateAdminUserResponse
} from './users.types.js'

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(
    @Headers('authorization') authorization: string | undefined,
    @Query('includeInactive') includeInactive: string | undefined
  ): Promise<AdminUserListResponse> {
    requireAdminAuthorization(authorization)

    return this.usersService.list(parseIncludeInactiveQuery(includeInactive))
  }

  @Get(':id')
  getById(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') userId: string
  ): Promise<AdminUserResponse> {
    requireAdminAuthorization(authorization)

    return this.usersService.getById(parseUserIdParam(userId))
  }

  @Post()
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown
  ): Promise<CreateAdminUserResponse> {
    requireAdminAuthorization(authorization)

    return this.usersService.create(parseCreateAdminUserBody(body))
  }

  @Put(':id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') userId: string,
    @Body() body: unknown
  ): Promise<AdminUserResponse> {
    requireAdminAuthorization(authorization)

    return this.usersService.update(
      parseUserIdParam(userId),
      parseUpdateAdminUserBody(body)
    )
  }

  @Delete(':id')
  remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') userId: string
  ): Promise<AdminUserResponse> {
    requireAdminAuthorization(authorization)

    return this.usersService.remove(parseUserIdParam(userId))
  }
}
