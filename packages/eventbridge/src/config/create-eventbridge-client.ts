import {
  EventBridgeClient,
  type EventBridgeClientConfig
} from '@aws-sdk/client-eventbridge'

import type { EventBridgeEnv } from './eventbridge-env.js'

export const createEventBridgeClient = (
  env: EventBridgeEnv
): EventBridgeClient => {
  const config: EventBridgeClientConfig = {
    region: env.region
  }

  if (env.endpoint) {
    config.endpoint = env.endpoint
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test'
    }
  }

  return new EventBridgeClient(config)
}
