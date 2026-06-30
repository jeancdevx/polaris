import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

import type { NotificationEvent } from './notification-event.js'
import { buildNotificationMessage } from './notification-event.js'
import type { NotificationSenderEnv } from './read-env.js'

export type NotificationSenderResponse = Readonly<{
  detailType: string
  reservationId: string
  userId: string
  message: string
  delivered: boolean
  channel: 'sns' | 'log'
}>

export type SendNotificationDependencies = Readonly<{
  env: NotificationSenderEnv
  snsClient: SNSClient
}>

export const createSendNotificationDependencies = (
  env: NotificationSenderEnv
): SendNotificationDependencies => ({
  env,
  snsClient: new SNSClient({})
})

export const sendNotification = async (
  event: NotificationEvent,
  deps: SendNotificationDependencies
): Promise<NotificationSenderResponse> => {
  const message = buildNotificationMessage(event)

  if (
    deps.env.notificationsEnabled &&
    deps.env.snsTopicArn &&
    event.detailType !== 'reservation.created'
  ) {
    await deps.snsClient.send(
      new PublishCommand({
        TopicArn: deps.env.snsTopicArn,
        Subject: `Polaris ${event.detailType}`,
        Message: JSON.stringify({
          userId: event.userId,
          reservationId: event.reservationId,
          parkingSpotId: event.parkingSpotId,
          message
        })
      })
    )

    return {
      detailType: event.detailType,
      reservationId: event.reservationId,
      userId: event.userId,
      message,
      delivered: true,
      channel: 'sns'
    }
  }

  return {
    detailType: event.detailType,
    reservationId: event.reservationId,
    userId: event.userId,
    message,
    delivered: deps.env.notificationsEnabled,
    channel: 'log'
  }
}
