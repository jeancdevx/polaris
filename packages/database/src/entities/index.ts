import { auditLogSchema } from './schemas/audit-log.schema.js'
import { parkingSessionSchema } from './schemas/parking-session.schema.js'
import { parkingSpotSchema } from './schemas/parking-spot.schema.js'
import { reservationSchema } from './schemas/reservation.schema.js'
import { rfidTagSchema } from './schemas/rfid-tag.schema.js'
import { sensorDataSchema } from './schemas/sensor-data.schema.js'
import { userSchema } from './schemas/user.schema.js'

export { auditLogSchema, type AuditLogRow } from './schemas/audit-log.schema.js'
export {
  parkingSessionSchema,
  type ParkingSessionRow
} from './schemas/parking-session.schema.js'
export {
  parkingSpotSchema,
  type ParkingSpotRow
} from './schemas/parking-spot.schema.js'
export {
  reservationSchema,
  type ReservationRow
} from './schemas/reservation.schema.js'
export { rfidTagSchema, type RfidTagRow } from './schemas/rfid-tag.schema.js'
export {
  sensorDataSchema,
  type SensorDataRow
} from './schemas/sensor-data.schema.js'
export {
  userSchema,
  type UserRole,
  type UserRow
} from './schemas/user.schema.js'

export const entitySchemas = [
  userSchema,
  parkingSpotSchema,
  reservationSchema,
  rfidTagSchema,
  parkingSessionSchema,
  auditLogSchema,
  sensorDataSchema
] as const
