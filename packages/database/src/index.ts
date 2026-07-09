export { readDatabaseEnv, type DatabaseEnv } from './config/database-env.js'
export {
  createDataSource,
  createDataSourceOptions
} from './config/create-data-source.js'

export { runMigrations } from './migrations/run-migrations.js'

export { runSeed, type SeedResult } from './seed/run-seed.js'

export {
  runBootstrapIfNeeded,
  type BootstrapDeps,
  type BootstrapResult,
  type BootstrapState
} from './bootstrap/run-bootstrap.js'

export {
  cognitoAdminExists,
  provisionCognitoAdmin,
  readCognitoAdminConfig,
  type CognitoAdminConfig
} from './bootstrap/cognito-admin.js'

export {
  syncParkingRedis,
  type SyncParkingRedisResult
} from './redis/sync-parking-redis.js'

export {
  flushParkingRedis,
  type FlushParkingRedisResult
} from './redis/flush-parking-redis.js'

export { runDevReset, type DevResetResult } from './bootstrap/run-dev-reset.js'

export {
  auditLogSchema,
  entitySchemas,
  parkingSpotSchema,
  parkingSessionSchema,
  reservationSchema,
  rfidTagSchema,
  sensorDataSchema,
  userSchema,
  type AuditLogRow,
  type ParkingSessionRow,
  type ParkingSpotRow,
  type ReservationRow,
  type RfidTagRow,
  type SensorDataRow,
  type UserRole,
  type UserRow
} from './entities/index.js'
