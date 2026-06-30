export type NotificationSenderEnv = Readonly<{
  notificationsEnabled: boolean
  snsTopicArn?: string
}>

export const readNotificationSenderEnv = (): NotificationSenderEnv => ({
  notificationsEnabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
  snsTopicArn: process.env.SNS_ALERTS_TOPIC_ARN
})
