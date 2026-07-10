import type { ParkingSpotRow } from '@polaris/database'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

export class ParkingCapacityRepository {
  async countFreeSpots(): Promise<number> {
    const dataSource = await getLambdaDataSource()

    return dataSource.getRepository<ParkingSpotRow>('ParkingSpot').count({
      where: { status: 'free' }
    })
  }
}
