import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { readHealthCheckerEnv } from './read-env.js'
import {
  createRunHealthChecksDependencies,
  runHealthChecks,
  type HealthCheckerResponse
} from './run-health-checks.js'

let dependencies = createRunHealthChecksDependencies(readHealthCheckerEnv())

export const resetHealthCheckerDependenciesForTests = (): void => {
  dependencies = createRunHealthChecksDependencies(readHealthCheckerEnv())
}

export const handler: Handler<unknown, HealthCheckerResponse> =
  instrumentLambdaHandler(
    { serviceName: 'health-checker' },
    async (_event, _context, logger) => {
      const result = await runHealthChecks(dependencies)

      logger.info('Health check completed', {
        healthy: result.healthy,
        alertSent: result.alertSent,
        checks: result.checks
      })

      return result
    }
  )
