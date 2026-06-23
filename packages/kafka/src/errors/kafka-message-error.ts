export type KafkaMessageError = Readonly<{
  _tag: 'KafkaMessageError'
  code: string
  message: string
}>

export const kafkaMessageError = (
  code: string,
  message: string
): KafkaMessageError => ({
  _tag: 'KafkaMessageError',
  code,
  message
})

export const isKafkaMessageError = (
  error: unknown
): error is KafkaMessageError =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  (error as KafkaMessageError)._tag === 'KafkaMessageError'
