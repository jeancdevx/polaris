import type { Logger } from '@polaris/lambda-core'

import { publishOccupancyChanged } from './appsync-client.js'
import {
  buildOccupancyChangedInput,
  type OccupancyPublisherEvent
} from './occupancy-event.js'
import type { AppSyncOccupancyPublisherEnv } from './read-env.js'

export type PublishOccupancyResponse = Readonly<{
  detailType: string
  parkingSpotId: string
  zone: string
  status: string
  published: boolean
}>

export type PublishOccupancyDependencies = Readonly<{
  env: AppSyncOccupancyPublisherEnv
  publish: typeof publishOccupancyChanged
}>

export const createPublishOccupancyDependencies = (
  env: AppSyncOccupancyPublisherEnv
): PublishOccupancyDependencies => ({
  env,
  publish: publishOccupancyChanged
})

export const publishOccupancy = async (
  event: OccupancyPublisherEvent,
  logger: Logger,
  deps: PublishOccupancyDependencies
): Promise<PublishOccupancyResponse> => {
  const input = buildOccupancyChangedInput(event)

  logger.info('Publishing occupancy change to AppSync', {
    detailType: event.detailType,
    parkingSpotId: event.parkingSpotId,
    zone: input.zone,
    status: input.status
  })

  const result = await deps.publish({
    endpoint: deps.env.appsyncGraphqlEndpoint,
    region: deps.env.awsRegion,
    payload: input
  })

  logger.info('AppSync occupancy mutation completed', {
    spotId: result.spotId,
    zone: result.zone,
    status: result.status
  })

  return {
    detailType: event.detailType,
    parkingSpotId: result.spotId,
    zone: result.zone,
    status: result.status,
    published: true
  }
}
