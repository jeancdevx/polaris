import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { parseNotificationEvent } from './notification-event.js'
import { readNotificationSenderEnv } from './read-env.js'
import {
  createSendNotificationDependencies,
  sendNotification,
  type NotificationSenderResponse
} from './send-notification.js'

let dependencies = createSendNotificationDependencies(
  readNotificationSenderEnv()
)

export const resetNotificationSenderDependenciesForTests = (): void => {
  dependencies = createSendNotificationDependencies(readNotificationSenderEnv())
}

export const handler: Handler<unknown, NotificationSenderResponse> =
  instrumentLambdaHandler(
    { serviceName: 'notification-sender' },
    async (event, _context, logger) => {
      const notification = parseNotificationEvent(event)
      const result = await sendNotification(notification, dependencies)

      logger.info('Notification processed', {
        detailType: result.detailType,
        reservationId: result.reservationId,
        userId: result.userId,
        channel: result.channel,
        delivered: result.delivered,
        message: result.message
      })

      return result
    }
  )
