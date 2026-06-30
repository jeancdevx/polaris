export type AuditLoggerEnv = Readonly<{
  auditLogGroupName: string
  s3BucketName?: string
  s3Prefix: string
  archiveEnabled: boolean
  cloudWatchAuditEnabled: boolean
}>

export const readAuditLoggerEnv = (): AuditLoggerEnv => ({
  auditLogGroupName: process.env.AUDIT_CLOUDWATCH_LOG_GROUP ?? '/polaris/audit',
  s3BucketName: process.env.AUDIT_S3_BUCKET,
  s3Prefix: process.env.AUDIT_S3_PREFIX ?? 'audit',
  archiveEnabled: process.env.AUDIT_ARCHIVE_ENABLED !== 'false',
  cloudWatchAuditEnabled: process.env.AUDIT_CLOUDWATCH_ENABLED !== 'false'
})
