export type AppSyncAvailabilityEnv = Readonly<{
  databaseUrl: string
  redisUrl: string
}>

export const readAppSyncAvailabilityEnv = (): AppSyncAvailabilityEnv => {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  const redisUrl = process.env.REDIS_URL?.trim()

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured')
  }

  if (!redisUrl) {
    throw new Error('REDIS_URL must be configured')
  }

  return { databaseUrl, redisUrl }
}
