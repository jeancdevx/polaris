import { Injectable } from '@nestjs/common'

import { buildZoneSummaries } from './parking.mapper.js'
import { ParkingStatusReader } from './parking-status.reader.js'
import { MetricsRepository } from './metrics.repository.js'
import type { AdminMetricsResponse, MetricsListQuery } from './metrics.types.js'

@Injectable()
export class MetricsService {
  constructor(
    private readonly parkingStatusReader: ParkingStatusReader,
    private readonly metricsRepository: MetricsRepository
  ) {}

  async getMetrics(query: MetricsListQuery): Promise<AdminMetricsResponse> {
    const parkingStatus = await this.parkingStatusReader.getParkingStatus()
    const filteredSpots = query.zone
      ? parkingStatus.spots.filter(spot => spot.zone === query.zone)
      : parkingStatus.spots

    const zones = buildZoneSummaries(filteredSpots)

    const [reservations, users, audit] = await Promise.all([
      this.metricsRepository.countReservations(query),
      this.metricsRepository.countUsers(),
      this.metricsRepository.summarizeAuditEvents(query)
    ])

    return {
      generatedAt: new Date().toISOString(),
      range: {
        from: query.from.toISOString(),
        to: query.to.toISOString()
      },
      occupancy: {
        totalSpots: filteredSpots.length,
        totalAvailable: filteredSpots.filter(spot => spot.status === 'free')
          .length,
        totalOccupied: filteredSpots.filter(spot => spot.status === 'occupied')
          .length,
        totalReserved: filteredSpots.filter(spot => spot.status === 'reserved')
          .length,
        zones
      },
      reservations,
      users,
      audit
    }
  }
}
