import type { AuditLog } from '@polaris/shared-types'

import type { PaginationQuery } from '../common/pagination.validation.js'

export type AuditLogFilters = Readonly<{
  eventType?: string
  userId?: string
  parkingSpotId?: string
  gate?: string
  userType?: AuditLog['userType']
  from?: Date
  to?: Date
}>

export type AuditLogListQuery = AuditLogFilters & PaginationQuery

export type AuditLogListResponse = Readonly<{
  items: AuditLog[]
  page: number
  limit: number
  total: number
  totalPages: number
}>
