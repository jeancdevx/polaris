import {
  CreateBucketCommand,
  GetObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import {
  GenericContainer,
  Wait,
  type StartedTestContainer
} from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createProcessAuditEventDependencies,
  processAuditEvent
} from './process-audit-event.js'
import { readAuditLoggerEnv } from './read-env.js'

const awsTestConfig = (endpoint: string) => ({
  region: 'us-east-1',
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

describe('audit-logger integration', () => {
  let localstack: StartedTestContainer
  let awsEndpoint: string
  const bucketName = 'polaris-audit-logs-test'

  beforeAll(async () => {
    localstack = await new GenericContainer('localstack/localstack:4.4.0')
      .withExposedPorts(4566)
      .withEnvironment({ SERVICES: 's3' })
      .withWaitStrategy(Wait.forLogMessage(/Ready\./))
      .start()

    awsEndpoint = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`

    process.env.AWS_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = 'test'
    process.env.AWS_SECRET_ACCESS_KEY = 'test'
    process.env.AWS_ENDPOINT_URL = awsEndpoint
    process.env.AUDIT_S3_BUCKET = bucketName
    process.env.AUDIT_CLOUDWATCH_ENABLED = 'false'
    process.env.AUDIT_ARCHIVE_ENABLED = 'true'

    const s3 = new S3Client(awsTestConfig(awsEndpoint))
    await s3.send(new CreateBucketCommand({ Bucket: bucketName }))
  }, 180_000)

  afterAll(async () => {
    await localstack.stop()
  }, 60_000)

  it('archives EventBridge audit events to S3', async () => {
    const deps = createProcessAuditEventDependencies(readAuditLoggerEnv())
    const logger = { info: () => undefined }

    const result = await processAuditEvent(
      {
        source: 'polaris.event-processor',
        'detail-type': 'vehicle.entry',
        time: '2025-06-19T14:05:00.000Z',
        detail: {
          eventName: 'vehicle.entry',
          aggregateId: 'evt-entry-001',
          occurredAt: '2025-06-19T14:05:00.000Z',
          parkingSpotId: 'spot-03',
          previousStatus: 'reserved',
          currentStatus: 'occupied'
        }
      },
      logger as never,
      deps
    )

    expect(result.archived).toBe(true)
    expect(result.s3Key).toContain('year=2025/month=06/day=19')

    const s3 = new S3Client(awsTestConfig(awsEndpoint))
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: result.s3Key!
      })
    )

    const body = JSON.parse((await object.Body?.transformToString()) ?? '{}')

    expect(body.eventType).toBe('vehicle.entry')
    expect(body.payload.parkingSpotId).toBe('spot-03')
  })
})
