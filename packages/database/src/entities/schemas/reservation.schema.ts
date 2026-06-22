import { EntitySchema } from 'typeorm'

import type { ReservationStatus } from '@polaris/shared-types'

import { createdAtColumn } from './timestamp-columns.js'

export type ReservationRow = Readonly<{
  reservationId: string
  userId: string
  parkingSpotId: string
  status: ReservationStatus
  reservationDate: Date
  expiresAt: Date
  checkedInAt?: Date
  checkedOutAt?: Date
  cancelledAt?: Date
  expiredAt?: Date
  createdAt: Date
}>

export const reservationSchema = new EntitySchema<ReservationRow>({
  name: 'Reservation',
  tableName: 'reservations',
  columns: {
    reservationId: {
      type: 'varchar',
      length: 32,
      primary: true,
      name: 'reservation_id'
    },
    userId: {
      type: 'varchar',
      length: 32,
      name: 'user_id'
    },
    parkingSpotId: {
      type: 'varchar',
      length: 16,
      name: 'parking_spot_id'
    },
    status: {
      type: 'varchar',
      length: 20
    },
    reservationDate: {
      type: 'timestamptz',
      name: 'reservation_date'
    },
    expiresAt: {
      type: 'timestamptz',
      name: 'expires_at'
    },
    checkedInAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'checked_in_at'
    },
    checkedOutAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'checked_out_at'
    },
    cancelledAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'cancelled_at'
    },
    expiredAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'expired_at'
    },
    createdAt: createdAtColumn()
  }
})
