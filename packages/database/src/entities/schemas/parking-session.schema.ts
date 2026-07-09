import { EntitySchema } from 'typeorm'

export type ParkingSessionStatus = 'open' | 'closed'

export type ParkingSessionRow = Readonly<{
  sessionId: string
  rfidUid: string
  userId?: string
  vehiclePlate?: string
  status: ParkingSessionStatus
  entryAt: Date
  exitAt?: Date
}>

export const parkingSessionSchema = new EntitySchema<ParkingSessionRow>({
  name: 'ParkingSession',
  tableName: 'parking_sessions',
  columns: {
    sessionId: {
      type: 'uuid',
      primary: true,
      name: 'session_id',
      generated: 'uuid'
    },
    rfidUid: {
      type: 'varchar',
      length: 17,
      name: 'rfid_uid'
    },
    userId: {
      type: 'varchar',
      length: 32,
      nullable: true,
      name: 'user_id'
    },
    vehiclePlate: {
      type: 'varchar',
      length: 16,
      nullable: true,
      name: 'vehicle_plate'
    },
    status: {
      type: 'varchar',
      length: 20
    },
    entryAt: {
      type: 'timestamptz',
      name: 'entry_at'
    },
    exitAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'exit_at'
    }
  }
})
