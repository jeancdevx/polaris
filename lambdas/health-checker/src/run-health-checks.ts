import {
  checkRds,
  checkRedis,
  type HealthCheckResult
} from './health-checks.js'
import type { HealthCheckerEnv } from './read-env.js'
import { SnsAlertPublisher } from './sns-alert.publisher.js'

export type HealthCheckerResponse = Readonly<{
  healthy: boolean
  checkedAt: string
  checks: HealthCheckResult[]
  alertSent: boolean
}>

export type RunHealthChecksDependencies = Readonly<{
  env: HealthCheckerEnv
  alertPublisher: SnsAlertPublisher
}>

export const createRunHealthChecksDependencies = (
  env: HealthCheckerEnv
): RunHealthChecksDependencies => ({
  env,
  alertPublisher: new SnsAlertPublisher(env)
})

export const runHealthChecks = async (
  deps: RunHealthChecksDependencies
): Promise<HealthCheckerResponse> => {
  const checks = await Promise.all([checkRds(), checkRedis(deps.env.redisUrl)])

  const alertSent = await deps.alertPublisher.publishFailures(checks)

  return {
    healthy: checks.every(check => check.healthy),
    checkedAt: new Date().toISOString(),
    checks,
    alertSent
  }
}
