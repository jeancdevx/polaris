import { Controller, Get } from '@nestjs/common'

export type HealthResponse = {
  status: 'ok'
  service: 'event-processor-service'
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'event-processor-service'
    }
  }
}
