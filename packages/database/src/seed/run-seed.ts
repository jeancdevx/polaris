import type { DataSource, EntityManager } from 'typeorm'

import {
  parkingSpotSchema,
  rfidTagSchema,
  userSchema,
  type UserRow
} from '../entities/index.js'

import { createDataSourceAsync } from '../config/create-data-source.js'

import { buildSeedData } from './seed-data.js'

export type SeedResult = Readonly<{
  users: number
  parkingSpots: number
  rfidTags: number
}>

/**
 * Seed upserts by primary key only. Users also have UNIQUE(rfid_uid) and
 * UNIQUE(email). When card ownership changes between deploys, a single
 * INSERT..ON CONFLICT(user_id) can violate UQ_users_rfid_uid mid-statement.
 * Free those unique values first, then upsert.
 */
export const releaseUserUniqueConflicts = async (
  manager: EntityManager,
  users: readonly UserRow[]
): Promise<void> => {
  const rfidUids = users.map(user => user.rfidUid)
  const emails = users.map(user => user.email)

  if (rfidUids.length > 0) {
    await manager.query(
      `UPDATE users
       SET rfid_uid = ('T' || substr(md5(user_id || ':rfid'), 1, 16))
       WHERE rfid_uid = ANY($1::text[])`,
      [rfidUids]
    )
  }

  if (emails.length > 0) {
    await manager.query(
      `UPDATE users
       SET email = ('tmp-' || substr(md5(user_id || ':email'), 1, 20) || '@polaris.invalid')
       WHERE email = ANY($1::text[])`,
      [emails]
    )
  }
}

const seedWithManager = async (manager: EntityManager): Promise<SeedResult> => {
  const { users, parkingSpots, rfidTags } = buildSeedData()

  await releaseUserUniqueConflicts(manager, users)

  await manager.getRepository(userSchema).upsert([...users], {
    conflictPaths: ['userId']
  })
  await manager.getRepository(parkingSpotSchema).upsert([...parkingSpots], {
    conflictPaths: ['spotId']
  })
  await manager.getRepository(rfidTagSchema).upsert([...rfidTags], {
    conflictPaths: ['rfidUid']
  })

  return {
    users: users.length,
    parkingSpots: parkingSpots.length,
    rfidTags: rfidTags.length
  }
}

export const runSeedWithDataSource = async (
  dataSource: DataSource
): Promise<SeedResult> =>
  dataSource.transaction(async manager => seedWithManager(manager))

export const runSeed = async (): Promise<SeedResult> => {
  const dataSource = await createDataSourceAsync()

  await dataSource.initialize()

  try {
    return await runSeedWithDataSource(dataSource)
  } finally {
    await dataSource.destroy()
  }
}
