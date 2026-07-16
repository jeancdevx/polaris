import {
  parkingSpotSchema,
  rfidTagSchema,
  userSchema
} from '../entities/index.js'

import { createDataSourceAsync } from '../config/create-data-source.js'

import { buildSeedData } from './seed-data.js'

export type SeedResult = Readonly<{
  users: number
  parkingSpots: number
  rfidTags: number
}>

export const runSeed = async (): Promise<SeedResult> => {
  const dataSource = await createDataSourceAsync()

  await dataSource.initialize()

  try {
    const { users, parkingSpots, rfidTags } = buildSeedData()

    await dataSource.getRepository(userSchema).upsert(users, {
      conflictPaths: ['userId']
    })
    await dataSource.getRepository(parkingSpotSchema).upsert(parkingSpots, {
      conflictPaths: ['spotId']
    })
    await dataSource.getRepository(rfidTagSchema).upsert(rfidTags, {
      conflictPaths: ['rfidUid']
    })

    return {
      users: users.length,
      parkingSpots: parkingSpots.length,
      rfidTags: rfidTags.length
    }
  } finally {
    await dataSource.destroy()
  }
}
