import type { RedisClientType, RedisClusterType } from 'redis'

import type { PolarisRedisClient } from './connect-redis.js'

export type ScanRedisKeysOptions = Readonly<{
  match: string
  count?: number
}>

const normalizeScanBatch = (rawKeys: string | string[]): string[] => {
  const keys = Array.isArray(rawKeys) ? rawKeys : [rawKeys]
  return keys.filter((key): key is string => Boolean(key))
}

const isRedisClusterClient = (
  client: PolarisRedisClient
): client is RedisClusterType => {
  return 'masters' in client && 'nodeClient' in client
}

export async function* scanRedisKeyBatches(
  client: PolarisRedisClient,
  options: ScanRedisKeysOptions
): AsyncGenerator<string[]> {
  const scanOptions = {
    MATCH: options.match,
    COUNT: options.count ?? 100
  }

  if (isRedisClusterClient(client)) {
    for (const master of client.masters) {
      const nodeClient: RedisClientType = await client.nodeClient(master)

      for await (const rawKeys of nodeClient.scanIterator(scanOptions)) {
        const keys = normalizeScanBatch(rawKeys)

        if (keys.length > 0) {
          yield keys
        }
      }
    }

    return
  }

  for await (const rawKeys of client.scanIterator(scanOptions)) {
    const keys = normalizeScanBatch(rawKeys)

    if (keys.length > 0) {
      yield keys
    }
  }
}
