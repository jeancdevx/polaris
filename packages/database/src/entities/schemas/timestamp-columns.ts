import type { EntitySchemaColumnOptions } from 'typeorm'

export const createdAtColumn = (): EntitySchemaColumnOptions => ({
  type: 'timestamptz',
  name: 'created_at',
  createDate: true
})

export const updatedAtColumn = (): EntitySchemaColumnOptions => ({
  type: 'timestamptz',
  name: 'updated_at',
  updateDate: true
})
