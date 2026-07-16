import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'

import { KafkaConsumerService } from '../processing/kafka-consumer.service.js'

export type HealthResponse = {
  status: 'ok'
  service: 'event-processor-service'
  kafka: {
    groupJoined: boolean
    lastProcessedAt: string | null
  }
}

@Controller('health')
export class HealthController {
  constructor(private readonly kafkaConsumer: KafkaConsumerService) {}

  @Get()
  getHealth(): HealthResponse {
    const kafka = this.kafkaConsumer.getHealthState()

    return {
      status: 'ok',
      service: 'event-processor-service',
      kafka: {
        groupJoined: kafka.groupJoined,
        lastProcessedAt: kafka.lastProcessedAt
      }
    }
  }

  @Get('ready')
  getReadiness(): HealthResponse {
    const response = this.getHealth()
    const kafka = this.kafkaConsumer.getHealthState()

    if (!kafka.ready) {
      throw new ServiceUnavailableException({
        ...response,
        status: 'unavailable',
        kafka: {
          ...response.kafka,
          stoppedUnexpectedly: kafka.stoppedUnexpectedly
        }
      })
    }

    return response
  }
}
