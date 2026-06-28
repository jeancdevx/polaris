import { Logger } from '@aws-lambda-powertools/logger'

export type PolarisLambdaLoggerOptions = {
  serviceName: string
}

export const createPolarisLambdaLogger = (
  options: PolarisLambdaLoggerOptions
): Logger =>
  new Logger({
    serviceName: options.serviceName,
    persistentLogAttributes: {
      project: 'polaris'
    }
  })

export type { Logger }
