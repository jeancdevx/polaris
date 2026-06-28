import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics'

export const POLARIS_METRICS_NAMESPACE = 'Polaris'

export type PolarisLambdaMetricsOptions = {
  serviceName: string
}

export const createPolarisLambdaMetrics = (
  options: PolarisLambdaMetricsOptions
): Metrics =>
  new Metrics({
    namespace: POLARIS_METRICS_NAMESPACE,
    serviceName: options.serviceName
  })

export { MetricUnit, Metrics }
