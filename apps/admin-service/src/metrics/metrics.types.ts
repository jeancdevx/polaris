import type { DateRangeQuery } from '../common/pagination.validation.js'

export type MetricsQuery = Readonly<{
  zone?: 'a' | 'b'
  from: Date
  to: Date
}>

export type AdminMetricsResponse = Readonly<{
  generatedAt: string
  range: {
    from: string
    to: string
  }
  occupancy: {
    totalSpots: number
    totalAvailable: number
    totalOccupied: number
    totalReserved: number
    zones: ReadonlyArray<{
      zone: string
      totalSpots: number
      totalAvailable: number
      totalOccupied: number
      totalReserved: number
    }>
  }
  reservations: {
    active: number
    checkedIn: number
    cancelledInRange: number
    expiredInRange: number
  }
  users: {
    active: number
    inactive: number
  }
  audit: {
    totalInRange: number
    byEventType: Record<string, number>
  }
}>

export type MetricsListQuery = MetricsQuery

export const defaultMetricsRange = (): DateRangeQuery => {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)

  return { from, to }
}
