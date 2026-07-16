import { DataSource, type DataSourceOptions } from 'typeorm'

import { loadLocalEnv } from '@polaris/shared-utils'

import { entitySchemas } from '../entities/index.js'

import { InitialSchema1740350000000 } from '../migrations/1740350000000-InitialSchema.js'
import { ParkingSessions1740350000001 } from '../migrations/1740350000001-ParkingSessions.js'
import { ReliableEvents1740350000002 } from '../migrations/1740350000002-ReliableEvents.js'

import { readDatabaseEnv } from './database-env.js'
import {
  hydrateDatabaseEnv,
  type HydrateDatabaseEnvOptions
} from './database-secret.js'

loadLocalEnv(import.meta.url)

export const createDataSourceOptions = (): DataSourceOptions => {
  const env = readDatabaseEnv()

  return {
    type: 'postgres',
    url: env.url,
    entities: [...entitySchemas],
    migrations: [
      InitialSchema1740350000000,
      ParkingSessions1740350000001,
      ReliableEvents1740350000002
    ],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: env.logging,
    extra: {
      connectionTimeoutMillis: 10_000
    }
  }
}

export const createDataSource = (): DataSource =>
  new DataSource(createDataSourceOptions())

export const createDataSourceAsync = async (
  options: HydrateDatabaseEnvOptions = {}
): Promise<DataSource> => {
  await hydrateDatabaseEnv(options)
  return createDataSource()
}
