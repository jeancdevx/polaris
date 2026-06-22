export { readDatabaseEnv, type DatabaseEnv } from './config/database-env.js'
export {
  createDataSource,
  createDataSourceOptions,
  dataSource
} from './config/create-data-source.js'

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
