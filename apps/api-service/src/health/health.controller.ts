import { Controller, Get } from '@nestjs/common'

export type HealthResponse = {
  status: 'ok'
  service: 'api-service'
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'api-service'
    }
  }
}
