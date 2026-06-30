import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  ResourceAlreadyExistsException
} from '@aws-sdk/client-cloudwatch-logs'

import { buildAuditLogStreamName, type AuditRecord } from './audit-record.js'
import type { AuditLoggerEnv } from './read-env.js'

export class CloudWatchAuditWriter {
  private readonly client: CloudWatchLogsClient
  private readonly ensuredStreams = new Set<string>()

  constructor(private readonly env: AuditLoggerEnv) {
    this.client = new CloudWatchLogsClient({
      region:
        process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
      ...(process.env.AWS_ENDPOINT_URL
        ? {
            endpoint: process.env.AWS_ENDPOINT_URL,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test'
            }
          }
        : {})
    })
  }

  async write(record: AuditRecord): Promise<void> {
    if (!this.env.cloudWatchAuditEnabled) {
      return
    }

    const logStreamName = buildAuditLogStreamName(record.occurredAt)
    await this.ensureLogStream(logStreamName)

    await this.client.send(
      new PutLogEventsCommand({
        logGroupName: this.env.auditLogGroupName,
        logStreamName,
        logEvents: [
          {
            message: JSON.stringify(record),
            timestamp: new Date(record.occurredAt).getTime()
          }
        ]
      })
    )
  }

  private async ensureLogStream(logStreamName: string): Promise<void> {
    if (this.ensuredStreams.has(logStreamName)) {
      return
    }

    try {
      await this.client.send(
        new CreateLogStreamCommand({
          logGroupName: this.env.auditLogGroupName,
          logStreamName
        })
      )
    } catch (error) {
      if (!(error instanceof ResourceAlreadyExistsException)) {
        throw error
      }
    }

    this.ensuredStreams.add(logStreamName)
  }
}
