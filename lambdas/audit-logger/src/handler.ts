import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import {
  createProcessAuditEventDependencies,
  processAuditEvent,
  type AuditLoggerResponse
} from './process-audit-event.js'
import { readAuditLoggerEnv } from './read-env.js'

let dependencies = createProcessAuditEventDependencies(readAuditLoggerEnv())

export const resetAuditLoggerDependenciesForTests = (): void => {
  dependencies = createProcessAuditEventDependencies(readAuditLoggerEnv())
}

export const handler: Handler<unknown, AuditLoggerResponse> =
  instrumentLambdaHandler(
    { serviceName: 'audit-logger' },
    async (event, _context, logger) =>
      processAuditEvent(event, logger, dependencies)
  )
