import {
  EVENTBRIDGE_DEFAULT_BUS_NAME,
  EVENTBRIDGE_SOURCE_EVENT_PROCESSOR
} from '../constants.js'

export type EventBridgeEnv = Readonly<{
  enabled: boolean
  busName: string
  region: string
  endpoint?: string
  source: string
}>

export const readEventBridgeEnv = (): EventBridgeEnv => ({
  enabled: process.env.EVENTBRIDGE_ENABLED !== 'false',
  busName: process.env.EVENTBRIDGE_BUS_NAME ?? EVENTBRIDGE_DEFAULT_BUS_NAME,
  region:
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL ?? process.env.LOCALSTACK_ENDPOINT,
  source: process.env.EVENTBRIDGE_SOURCE ?? EVENTBRIDGE_SOURCE_EVENT_PROCESSOR
})
