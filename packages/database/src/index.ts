export { readDatabaseEnv, type DatabaseEnv } from './config/database-env.js'
export {
  createDataSource,
  createDataSourceAsync,
  createDataSourceOptions
} from './config/create-data-source.js'
export {
  hydrateDatabaseEnv,
  resetDatabaseSecretCacheForTests,
  type DatabaseSecretLoader,
  type HydrateDatabaseEnvOptions
} from './config/database-secret.js'

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
  parkingRedisHashForRow,
  reconcileParkingRedis,
  syncParkingRedis,
  type SyncParkingRedisResult
} from './redis/sync-parking-redis.js'

export {
  flushParkingRedis,
  type FlushParkingRedisResult
} from './redis/flush-parking-redis.js'

export { runDevReset, type DevResetResult } from './bootstrap/run-dev-reset.js'

export {
  enqueueOutboxEvent,
  outboxPayload,
  type EnqueueOutboxEventInput
} from './outbox/outbox.js'
export {
  processConsumedEventOnce,
  type ConsumedEventIdentity
} from './idempotency/consumed-events.js'

export {
  auditLogSchema,
  consumedEventSchema,
  entitySchemas,
  outboxEventSchema,
  parkingSpotSchema,
  parkingSessionSchema,
  reservationSchema,
  rfidTagSchema,
  sensorDataSchema,
  userSchema,
  type AuditLogRow,
  type ConsumedEventRow,
  type OutboxEventRow,
  type ParkingSessionRow,
  type ParkingSpotRow,
  type ReservationRow,
  type RfidTagRow,
  type SensorDataRow,
  type UserRole,
  type UserRow
} from './entities/index.js'
