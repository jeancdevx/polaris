import { Controller, Get, Headers, Query } from '@nestjs/common'

import { requireAdminAuthorization } from '../auth/admin-auth.validation.js'

import { parseMetricsListQuery } from './metrics-query.validation.js'
import type { AdminMetricsResponse } from './metrics.types.js'
import { MetricsService } from './metrics.service.js'

@Controller('admin/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(
    @Headers('authorization') authorization: string | undefined,
    @Query('zone') zone: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined
  ): Promise<AdminMetricsResponse> {
    requireAdminAuthorization(authorization)

    return this.metricsService.getMetrics(
      parseMetricsListQuery({ zone, from, to })
    )
  }
}
