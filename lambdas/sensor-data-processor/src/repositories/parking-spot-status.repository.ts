import type { ParkingSpotRow } from '@polaris/database'
import type { ParkingSpotStatus } from '@polaris/shared-types'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

export type ParkingSpotStatusRecord = Readonly<{
  spotId: string
  status: ParkingSpotStatus
}>

export class ParkingSpotStatusRepository {
  async listStatusesInRange(
    spotFirst: number,
    spotLast: number
  ): Promise<ParkingSpotStatusRecord[]> {
    const dataSource = await getLambdaDataSource()
    const rows = await dataSource
      .getRepository<ParkingSpotRow>('ParkingSpot')
      .find({ order: { spotId: 'ASC' } })

    return rows
      .filter(row => {
        const spotNumber = Number.parseInt(row.spotId.replace('spot-', ''), 10)
        return (
          !Number.isNaN(spotNumber) &&
          spotNumber >= spotFirst &&
          spotNumber <= spotLast
        )
      })
      .map(row => ({
        spotId: row.spotId,
        status: row.status as ParkingSpotStatus
      }))
  }
}
