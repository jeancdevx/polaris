import {
  createClient,
  createCluster,
  type RedisClientType,
  type RedisClusterType
} from 'redis'

export type PolarisRedisClient = RedisClientType | RedisClusterType

const clusterModeFromEnv = (): boolean | undefined => {
  const value = process.env.REDIS_CLUSTER_MODE?.trim().toLowerCase()

  if (value === 'true' || value === '1') {
    return true
  }

  if (value === 'false' || value === '0') {
    return false
  }

  return undefined
}

export const isRedisClusterUrl = (redisUrl: string): boolean => {
  const fromEnv = clusterModeFromEnv()

  if (fromEnv !== undefined) {
    return fromEnv
  }

  try {
    return new URL(redisUrl).hostname.includes('.clustercfg.')
  } catch {
    return false
  }
}

export type ConnectRedisOptions = Readonly<{
  socket?: {
    connectTimeout?: number
  }
}>

export const connectRedis = async (
  redisUrl: string,
  options?: ConnectRedisOptions
): Promise<PolarisRedisClient> => {
  if (isRedisClusterUrl(redisUrl)) {
    const cluster = createCluster({
      rootNodes: [{ url: redisUrl }],
      defaults: {
        socket: options?.socket
      }
    })
    await cluster.connect()
    return cluster
  }

  const client = createClient({
    url: redisUrl,
    socket: options?.socket
  })
  await client.connect()
  return client
}

export const disconnectRedis = async (
  client: PolarisRedisClient
): Promise<void> => {
  if (client.isOpen) {
    await client.quit()
  }
}
