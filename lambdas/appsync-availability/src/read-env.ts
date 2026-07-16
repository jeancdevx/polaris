export type AppSyncAvailabilityEnv = Readonly<{
  redisUrl: string
}>

export const readAppSyncAvailabilityEnv = (): AppSyncAvailabilityEnv => {
  const redisUrl = process.env.REDIS_URL?.trim()

  if (!redisUrl) {
    throw new Error('REDIS_URL must be configured')
  }

  return { redisUrl }
}
