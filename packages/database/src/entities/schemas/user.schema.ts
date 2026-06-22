import { EntitySchema } from 'typeorm'

import type { UserType } from '@polaris/shared-types'

import { createdAtColumn, updatedAtColumn } from './timestamp-columns.js'

export type UserRole = 'user' | 'admin'

export type UserRow = Readonly<{
  userId: string
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}>

export const userSchema = new EntitySchema<UserRow>({
  name: 'User',
  tableName: 'users',
  columns: {
    userId: {
      type: 'varchar',
      length: 32,
      primary: true,
      name: 'user_id'
    },
    name: {
      type: 'varchar',
      length: 100
    },
    email: {
      type: 'varchar',
      length: 255,
      unique: true
    },
    vehiclePlate: {
      type: 'varchar',
      length: 16,
      name: 'vehicle_plate'
    },
    rfidUid: {
      type: 'varchar',
      length: 17,
      unique: true,
      name: 'rfid_uid'
    },
    userType: {
      type: 'varchar',
      length: 20,
      name: 'user_type',
      default: 'registered'
    },
    role: {
      type: 'varchar',
      length: 20,
      default: 'user'
    },
    isActive: {
      type: 'boolean',
      name: 'is_active',
      default: true
    },
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  }
})
