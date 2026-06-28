export type KafkaAuthMode = 'plain' | 'iam'

export type KafkaEnv = Readonly<{
  authMode: KafkaAuthMode
  brokers: string[]
  clientId: string
  region: string
}>

const readAuthMode = (): KafkaAuthMode => {
  const raw = process.env.KAFKA_AUTH_MODE?.trim().toLowerCase()

  if (raw === 'iam') {
    return 'iam'
  }

  return 'plain'
}

export const readKafkaEnv = (): KafkaEnv => {
  const brokers = (process.env.KAFKA_BROKERS ?? '')
    .split(',')
    .map(broker => broker.trim())
    .filter(Boolean)

  if (brokers.length === 0) {
    throw new Error('KAFKA_BROKERS is not set')
  }

  const authMode = readAuthMode()

  if (
    authMode === 'iam' &&
    !process.env.AWS_REGION &&
    !process.env.AWS_DEFAULT_REGION
  ) {
    throw new Error('AWS_REGION is required when KAFKA_AUTH_MODE=iam')
  }

  return {
    authMode,
    brokers,
    clientId: process.env.KAFKA_CLIENT_ID ?? 'polaris-local',
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? ''
  }
}
