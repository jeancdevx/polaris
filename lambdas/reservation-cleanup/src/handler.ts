import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import {
  createExpireExpiredReservationsDependencies,
  expireExpiredReservations,
  type ReservationCleanupResponse
} from './expire-expired-reservations.js'
import { readReservationCleanupEnv } from './read-env.js'

let dependencies = createExpireExpiredReservationsDependencies(
  readReservationCleanupEnv()
)

export const resetReservationCleanupDependenciesForTests = (): void => {
  dependencies = createExpireExpiredReservationsDependencies(
    readReservationCleanupEnv()
  )
}

export const handler: Handler<unknown, ReservationCleanupResponse> =
  instrumentLambdaHandler(
    { serviceName: 'reservation-cleanup' },
    async (_event, _context, logger) => {
      const result = await expireExpiredReservations(new Date(), dependencies)

      logger.info('Reservation cleanup completed', {
        expiredCount: result.expiredCount,
        reservationIds: result.reservationIds
      })

      return result
    }
  )
