import { adminFetch } from '@/lib/admin/client'
import type { AdminMetricsResponse, MetricsFilters } from '@/lib/admin/types'

export const getMetrics = (
  filters: MetricsFilters = {}
): Promise<AdminMetricsResponse> =>
  adminFetch<AdminMetricsResponse>('/metrics', {
    searchParams: {
      zone: filters.zone,
      from: filters.from,
      to: filters.to
    }
  })
