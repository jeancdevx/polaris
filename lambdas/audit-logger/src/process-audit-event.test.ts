import { describe, expect, it, vi } from 'vitest'

import type { AuditRecord } from './audit-record.js'
import { CloudWatchAuditWriter } from './cloudwatch-audit-writer.js'
import {
  createProcessAuditEventDependencies,
  processAuditEvent
} from './process-audit-event.js'
import type { AuditLoggerEnv } from './read-env.js'
import { S3AuditArchiver } from './s3-audit-archiver.js'

const sampleRecord: AuditRecord = {
  eventType: 'vehicle.entry',
  aggregateId: 'evt-entry-001',
  occurredAt: '2025-06-19T14:05:00.000Z',
  source: 'polaris.event-processor',
  payload: {
    parkingSpotId: 'spot-03'
  }
}

const baseEnv: AuditLoggerEnv = {
  auditLogGroupName: '/polaris/audit',
  s3BucketName: 'polaris-audit-logs-dev',
  s3Prefix: 'audit',
  archiveEnabled: true,
  cloudWatchAuditEnabled: true
}

describe('processAuditEvent', () => {
  it('writes to CloudWatch and S3', async () => {
    const cloudWatchWriter = {
      write: vi.fn().mockResolvedValue(undefined)
    } as unknown as CloudWatchAuditWriter

    const s3Archiver = {
      archive: vi
        .fn()
        .mockResolvedValue(
          'audit/year=2025/month=06/day=19/1718803500000-evt-entry-001.json'
        )
    } as unknown as S3AuditArchiver

    const logger = {
      info: vi.fn()
    }

    const result = await processAuditEvent(
      {
        source: 'polaris.event-processor',
        'detail-type': 'vehicle.entry',
        detail: sampleRecord.payload
      },
      logger as never,
      {
        env: baseEnv,
        cloudWatchWriter,
        s3Archiver
      }
    )

    expect(result.archived).toBe(true)
    expect(result.cloudWatchLogged).toBe(true)
    expect(cloudWatchWriter.write).toHaveBeenCalledOnce()
    expect(s3Archiver.archive).toHaveBeenCalledOnce()
  })

  it('creates dependencies from env', () => {
    const deps = createProcessAuditEventDependencies(baseEnv)
    expect(deps.cloudWatchWriter).toBeInstanceOf(CloudWatchAuditWriter)
    expect(deps.s3Archiver).toBeInstanceOf(S3AuditArchiver)
  })
})
