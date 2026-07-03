import { adminFetch } from '@/lib/admin/client'
import type { AuditLogFilters, AuditLogListResponse } from '@/lib/admin/types'

export const listAuditLogs = (
  filters: AuditLogFilters
): Promise<AuditLogListResponse> =>
  adminFetch<AuditLogListResponse>('/audit', {
    searchParams: {
      page: filters.page,
      limit: filters.limit,
      eventType: filters.eventType,
      userId: filters.userId,
      parkingSpotId: filters.parkingSpotId,
      gate: filters.gate,
      userType: filters.userType,
      from: filters.from,
      to: filters.to
    }
  })
