import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

export type PrivateApiSmokeResult = Readonly<{
  privateApiBaseUrl: string
  adminUnauthorizedStatus: number
  internalRouteStatus: number
}>

const readBaseUrl = (): string => {
  const baseUrl = process.env.PRIVATE_API_BASE_URL?.replace(/\/$/, '')
  if (!baseUrl) {
    throw new Error('PRIVATE_API_BASE_URL must be configured')
  }

  return baseUrl
}

export const handler: Handler<unknown, PrivateApiSmokeResult> =
  instrumentLambdaHandler(
    { serviceName: 'api-gateway-private-smoke' },
    async (_event, _context, logger) => {
      const privateApiBaseUrl = readBaseUrl()

      const adminResponse = await fetch(`${privateApiBaseUrl}/admin/users`)
      const internalResponse = await fetch(
        `${privateApiBaseUrl}/internal/parking/status`
      )

      if (adminResponse.status !== 401) {
        throw new Error(
          `Expected 401 from unauthenticated /admin/users, got ${adminResponse.status}`
        )
      }

      if (internalResponse.status < 400 || internalResponse.status >= 500) {
        throw new Error(
          `Expected 4xx from /internal/parking/status (no handler yet), got ${internalResponse.status}`
        )
      }

      const result: PrivateApiSmokeResult = {
        privateApiBaseUrl,
        adminUnauthorizedStatus: adminResponse.status,
        internalRouteStatus: internalResponse.status
      }

      logger.info('Private API Gateway smoke test passed', result)

      return result
    }
  )
