import { DataSource, type DataSourceOptions } from 'typeorm'

import { entitySchemas } from '../entities/index.js'

import { InitialSchema1740350000000 } from '../migrations/1740350000000-InitialSchema.js'

import { readDatabaseEnv } from './database-env.js'
import { loadEnv } from './load-env.js'

loadEnv()

export const createDataSourceOptions = (): DataSourceOptions => {
  const env = readDatabaseEnv()

  return {
    type: 'postgres',
    url: env.url,
    entities: [...entitySchemas],
    migrations: [InitialSchema1740350000000],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: env.logging
  }
}

export const createDataSource = (): DataSource =>
  new DataSource(createDataSourceOptions())

export const dataSource = createDataSource()
