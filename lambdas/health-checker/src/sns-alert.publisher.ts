import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

import type { HealthCheckResult } from './health-checks.js'
import type { HealthCheckerEnv } from './read-env.js'

export class SnsAlertPublisher {
  constructor(
    private readonly env: HealthCheckerEnv,
    private readonly snsClient = new SNSClient({})
  ) {}

  async publishFailures(checks: HealthCheckResult[]): Promise<boolean> {
    const failures = checks.filter(check => !check.healthy)

    if (
      failures.length === 0 ||
      !this.env.alertsEnabled ||
      !this.env.snsTopicArn
    ) {
      return false
    }

    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.env.snsTopicArn,
        Subject: 'Polaris health check failed',
        Message: JSON.stringify({
          failedChecks: failures,
          checkedAt: new Date().toISOString()
        })
      })
    )

    return true
  }
}
