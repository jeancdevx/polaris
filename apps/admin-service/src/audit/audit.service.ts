import { Injectable } from '@nestjs/common'

import { buildPaginatedResponse } from '../common/pagination.validation.js'

import { mapAuditLogRow } from './audit.mapper.js'
import { AuditRepository } from './audit.repository.js'
import type { AuditLogListQuery, AuditLogListResponse } from './audit.types.js'

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async list(query: AuditLogListQuery): Promise<AuditLogListResponse> {
    const { rows, total } = await this.auditRepository.findLogs(query)

    return buildPaginatedResponse({
      items: rows.map(mapAuditLogRow),
      total,
      page: query.page,
      limit: query.limit
    })
  }
}
