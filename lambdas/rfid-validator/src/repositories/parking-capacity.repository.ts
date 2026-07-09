import type { ParkingSpotRow } from '@polaris/database'
import { createDataSource } from '@polaris/database'

export class ParkingCapacityRepository {
  async countFreeSpots(): Promise<number> {
    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      return dataSource.getRepository<ParkingSpotRow>('ParkingSpot').count({
        where: { status: 'free' }
      })
    } finally {
      await dataSource.destroy()
    }
  }
}
