import { Tracer } from '@aws-lambda-powertools/tracer'

export type PolarisLambdaTracerOptions = {
  serviceName: string
}

export const createPolarisLambdaTracer = (
  options: PolarisLambdaTracerOptions
): Tracer =>
  new Tracer({
    serviceName: options.serviceName,
    captureHTTPsRequests: false
  })

export type { Tracer }
