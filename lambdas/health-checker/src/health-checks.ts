import { createDataSourceAsync } from '@polaris/database'
import { connectRedis, disconnectRedis } from '@polaris/shared-utils'

export type HealthCheckResult = Readonly<{
  name: string
  healthy: boolean
  detail?: string
}>

export const checkRds = async (): Promise<HealthCheckResult> => {
  const dataSource = await createDataSourceAsync()

  try {
    await dataSource.initialize()
    await dataSource.query('SELECT 1')
    return { name: 'rds', healthy: true }
  } catch (error) {
    return {
      name: 'rds',
      healthy: false,
      detail: error instanceof Error ? error.message : 'RDS check failed'
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

export const checkRedis = async (
  redisUrl: string
): Promise<HealthCheckResult> => {
  const client = await connectRedis(redisUrl, {
    socket: {
      connectTimeout: 5_000
    }
  })

  try {
    const pong = await client.ping()

    return {
      name: 'redis',
      healthy: pong === 'PONG',
      detail: pong === 'PONG' ? undefined : `Unexpected ping response: ${pong}`
    }
  } catch (error) {
    return {
      name: 'redis',
      healthy: false,
      detail: error instanceof Error ? error.message : 'Redis check failed'
    }
  } finally {
    await disconnectRedis(client)
  }
}
