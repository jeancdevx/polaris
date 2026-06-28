import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware'
import middy from '@middy/core'
import type { Context, Handler } from 'aws-lambda'

import { createPolarisLambdaLogger, type Logger } from './logger.js'
import { createPolarisLambdaTracer } from './tracer.js'

export type InstrumentLambdaHandlerOptions = {
  serviceName: string
}

export type InstrumentedLambdaHandler<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  logger: Logger
) => Promise<TResult>

export const instrumentLambdaHandler = <TEvent, TResult>(
  options: InstrumentLambdaHandlerOptions,
  handler: InstrumentedLambdaHandler<TEvent, TResult>
): Handler<TEvent, TResult> => {
  const logger = createPolarisLambdaLogger(options)
  const tracer = createPolarisLambdaTracer(options)

  const businessHandler: Handler<TEvent, TResult> = async (
    event,
    context
  ): Promise<TResult> => {
    logger.addContext(context)
    logger.info('Invocation started')

    try {
      const result = await handler(event, context, logger)
      logger.info('Invocation completed')
      return result
    } catch (error) {
      logger.error('Invocation failed', { error })
      throw error
    }
  }

  return middy(businessHandler).use(captureLambdaHandler(tracer))
}
