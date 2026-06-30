import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { buildS3ObjectKey, type AuditRecord } from './audit-record.js'
import type { AuditLoggerEnv } from './read-env.js'

export class S3AuditArchiver {
  private readonly client: S3Client

  constructor(private readonly env: AuditLoggerEnv) {
    this.client = new S3Client({
      region:
        process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
      ...(process.env.AWS_ENDPOINT_URL
        ? {
            endpoint: process.env.AWS_ENDPOINT_URL,
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test'
            }
          }
        : {})
    })
  }

  async archive(record: AuditRecord): Promise<string> {
    if (!this.env.archiveEnabled) {
      throw new Error('S3 audit archive is disabled')
    }

    if (!this.env.s3BucketName) {
      throw new Error('AUDIT_S3_BUCKET is not configured')
    }

    const key = buildS3ObjectKey(this.env.s3Prefix, record)

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.s3BucketName,
        Key: key,
        Body: JSON.stringify(record),
        ContentType: 'application/json'
      })
    )

    return key
  }
}
