import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { parseOccupancyPublisherEvent } from './occupancy-event.js'
import {
  createPublishOccupancyDependencies,
  publishOccupancy,
  type PublishOccupancyResponse
} from './publish-occupancy.js'
import { readAppSyncOccupancyPublisherEnv } from './read-env.js'

let dependencies = createPublishOccupancyDependencies(
  readAppSyncOccupancyPublisherEnv()
)

export const resetAppSyncOccupancyPublisherDependenciesForTests = (): void => {
  dependencies = createPublishOccupancyDependencies(
    readAppSyncOccupancyPublisherEnv()
  )
}

export const handler: Handler<unknown, PublishOccupancyResponse> =
  instrumentLambdaHandler(
    { serviceName: 'appsync-occupancy-publisher' },
    async (event, _context, logger) => {
      const occupancyEvent = parseOccupancyPublisherEvent(event)
      return publishOccupancy(occupancyEvent, logger, dependencies)
    }
  )
