import { Controller, Get, Headers, Query } from '@nestjs/common'

import { requireAdminAuthorization } from '../auth/admin-auth.validation.js'
import { parseAuditLogListQuery } from './audit-query.validation.js'
import { AuditService } from './audit.service.js'
import type { AuditLogListResponse } from './audit.types.js'

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Headers('authorization') authorization: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('eventType') eventType: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('parkingSpotId') parkingSpotId: string | undefined,
    @Query('gate') gate: string | undefined,
    @Query('userType') userType: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined
  ): Promise<AuditLogListResponse> {
    requireAdminAuthorization(authorization)

    return this.auditService.list(
      parseAuditLogListQuery({
        page,
        limit,
        eventType,
        userId,
        parkingSpotId,
        gate,
        userType,
        from,
        to
      })
    )
  }
}
