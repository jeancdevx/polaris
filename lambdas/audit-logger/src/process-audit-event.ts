import type { Logger } from '@polaris/lambda-core'

import { parseIncomingAuditEvent, type AuditRecord } from './audit-record.js'
import { CloudWatchAuditWriter } from './cloudwatch-audit-writer.js'
import type { AuditLoggerEnv } from './read-env.js'
import { S3AuditArchiver } from './s3-audit-archiver.js'

export type AuditLoggerResponse = Readonly<{
  eventType: string
  aggregateId: string
  archived: boolean
  s3Key?: string
  cloudWatchLogged: boolean
}>

export type ProcessAuditEventDependencies = Readonly<{
  env: AuditLoggerEnv
  cloudWatchWriter: CloudWatchAuditWriter
  s3Archiver: S3AuditArchiver
}>

export const createProcessAuditEventDependencies = (
  env: AuditLoggerEnv
): ProcessAuditEventDependencies => ({
  env,
  cloudWatchWriter: new CloudWatchAuditWriter(env),
  s3Archiver: new S3AuditArchiver(env)
})

export const processAuditEvent = async (
  rawEvent: unknown,
  logger: Logger,
  deps: ProcessAuditEventDependencies
): Promise<AuditLoggerResponse> => {
  const record = parseIncomingAuditEvent(rawEvent)

  logger.info('Audit event received', {
    eventType: record.eventType,
    aggregateId: record.aggregateId,
    source: record.source
  })

  const s3Key = await writeAuditRecord(record, deps)

  return {
    eventType: record.eventType,
    aggregateId: record.aggregateId,
    archived: Boolean(s3Key),
    s3Key,
    cloudWatchLogged: deps.env.cloudWatchAuditEnabled
  }
}

const writeAuditRecord = async (
  record: AuditRecord,
  deps: ProcessAuditEventDependencies
): Promise<string | undefined> => {
  if (deps.env.cloudWatchAuditEnabled) {
    await deps.cloudWatchWriter.write(record)
  }

  if (deps.env.archiveEnabled && deps.env.s3BucketName) {
    return deps.s3Archiver.archive(record)
  }

  return undefined
}
