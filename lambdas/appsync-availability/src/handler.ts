import type { AppSyncResolverHandler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'
import type { ParkingStatus } from '@polaris/shared-types'

import { getAvailability } from './get-availability.js'
import { readAppSyncAvailabilityEnv } from './read-env.js'

export const handler: AppSyncResolverHandler<unknown, ParkingStatus> =
  instrumentLambdaHandler({ serviceName: 'appsync-availability' }, async () => {
    const env = readAppSyncAvailabilityEnv()
    return getAvailability(env)
  })
