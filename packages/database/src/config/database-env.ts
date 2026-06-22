export type DatabaseEnv = Readonly<{
  url: string
  logging: boolean
}>

export const readDatabaseEnv = (): DatabaseEnv => ({
  url:
    process.env.DATABASE_URL ??
    (() => {
      throw new Error('DATABASE_URL is not set')
    })(),
  logging: process.env.DB_LOGGING === 'true'
})
