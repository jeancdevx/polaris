import { EntitySchema } from 'typeorm'

import type { ParkingSpotStatus } from '@polaris/shared-types'

import { updatedAtColumn } from './timestamp-columns.js'

export type ParkingSpotRow = Readonly<{
  spotId: string
  zone: string
  status: ParkingSpotStatus
  reservationId?: string
  userId?: string
  occupiedSince?: Date
  updatedAt: Date
}>

export const parkingSpotSchema = new EntitySchema<ParkingSpotRow>({
  name: 'ParkingSpot',
  tableName: 'parking_spots',
  columns: {
    spotId: {
      type: 'varchar',
      length: 16,
      primary: true,
      name: 'spot_id'
    },
    zone: {
      type: 'char',
      length: 1
    },
    status: {
      type: 'varchar',
      length: 20,
      default: 'free'
    },
    reservationId: {
      type: 'varchar',
      length: 32,
      nullable: true,
      name: 'reservation_id'
    },
    userId: {
      type: 'varchar',
      length: 32,
      nullable: true,
      name: 'user_id'
    },
    occupiedSince: {
      type: 'timestamptz',
      nullable: true,
      name: 'occupied_since'
    },
    updatedAt: updatedAtColumn()
  }
})
