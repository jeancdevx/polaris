export type DatabaseEnv = Readonly<{
  url: string
  logging: boolean
}>

const defaultDatabaseUrl =
  'postgresql://parking_admin:parking_dev@localhost:5432/parking_db'

export const readDatabaseEnv = (): DatabaseEnv => ({
  url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  logging: process.env.DB_LOGGING === 'true'
})
