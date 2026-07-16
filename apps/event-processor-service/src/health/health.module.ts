import { Module } from '@nestjs/common'

import { EventProcessorModule } from '../processing/event-processor.module.js'
import { HealthController } from './health.controller.js'

@Module({
  imports: [EventProcessorModule],
  controllers: [HealthController]
})
export class HealthModule {}
