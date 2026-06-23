export type KafkaEnv = Readonly<{
  brokers: string[]
  clientId: string
}>

export const readKafkaEnv = (): KafkaEnv => {
  const brokers = (process.env.KAFKA_BROKERS ?? '')
    .split(',')
    .map(broker => broker.trim())
    .filter(Boolean)

  if (brokers.length === 0) {
    throw new Error('KAFKA_BROKERS is not set')
  }

  return {
    brokers,
    clientId: process.env.KAFKA_CLIENT_ID ?? 'polaris-local'
  }
}
