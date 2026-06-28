import type { Handler } from 'aws-lambda'

import { runKafkaSmokeTest, type KafkaSmokeTestResult } from '@polaris/kafka'
import { instrumentLambdaHandler } from '@polaris/lambda-core'

export const handler: Handler<unknown, KafkaSmokeTestResult> =
  instrumentLambdaHandler(
    { serviceName: 'kafka-msk-smoke' },
    async (_event, _context, logger) => {
      const result = await runKafkaSmokeTest({
        clientId: process.env.KAFKA_CLIENT_ID ?? 'polaris-kafka-msk-smoke'
      })

      logger.info('MSK IAM smoke test passed', {
        topic: result.topic,
        reservationId: result.reservationId,
        consumerGroupId: result.consumerGroupId
      })

      return result
    }
  )
