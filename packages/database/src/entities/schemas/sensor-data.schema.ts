import { EntitySchema } from 'typeorm'

export type SensorDataRow = Readonly<{
  id: number
  sensorId: string
  sensorType: string
  value: Record<string, unknown>
  recordedAt: Date
}>

export const sensorDataSchema = new EntitySchema<SensorDataRow>({
  name: 'SensorData',
  tableName: 'sensor_data',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: 'increment'
    },
    sensorId: {
      type: 'varchar',
      length: 64,
      name: 'sensor_id'
    },
    sensorType: {
      type: 'varchar',
      length: 50,
      name: 'sensor_type'
    },
    value: {
      type: 'jsonb'
    },
    recordedAt: {
      type: 'timestamptz',
      name: 'recorded_at',
      createDate: true
    }
  }
})
