import { EntitySchema } from 'typeorm'

import type { UserType } from '@polaris/shared-types'

import { createdAtColumn } from './timestamp-columns.js'

export type RfidTagRow = Readonly<{
  rfidUid: string
  userId: string
  userType: UserType
  vehiclePlate: string
  isActive: boolean
  validUntil?: Date
  createdAt: Date
}>

export const rfidTagSchema = new EntitySchema<RfidTagRow>({
  name: 'RfidTag',
  tableName: 'rfid_tags',
  columns: {
    rfidUid: {
      type: 'varchar',
      length: 17,
      primary: true,
      name: 'rfid_uid'
    },
    userId: {
      type: 'varchar',
      length: 32,
      name: 'user_id'
    },
    userType: {
      type: 'varchar',
      length: 20,
      name: 'user_type',
      default: 'registered'
    },
    vehiclePlate: {
      type: 'varchar',
      length: 16,
      name: 'vehicle_plate'
    },
    isActive: {
      type: 'boolean',
      name: 'is_active',
      default: true
    },
    validUntil: {
      type: 'timestamptz',
      nullable: true,
      name: 'valid_until'
    },
    createdAt: createdAtColumn()
  }
})
