export { readDatabaseEnv, type DatabaseEnv } from './config/database-env.js'
export {
  createDataSource,
  createDataSourceOptions,
  dataSource
} from './config/create-data-source.js'

export { runMigrations } from './migrations/run-migrations.js'

export { runSeed, type SeedResult } from './seed/run-seed.js'

export {
  auditLogSchema,
  entitySchemas,
  parkingSpotSchema,
  reservationSchema,
  rfidTagSchema,
  sensorDataSchema,
  userSchema,
  type AuditLogRow,
  type ParkingSpotRow,
  type ReservationRow,
  type RfidTagRow,
  type SensorDataRow,
  type UserRole,
  type UserRow
} from './entities/index.js'
