import { Logger } from '@nestjs/common'

import {
  AuditLogRepository,
  type InsertAuditLogInput
} from './audit-log.repository.js'

const logger = new Logger('AuditLogSafe')

/** Persist audit without failing the primary parking/LED flow. */
export const insertAuditLogSafe = async (
  repository: AuditLogRepository,
  input: InsertAuditLogInput
): Promise<void> => {
  try {
    await repository.insert(input)
  } catch (error) {
    logger.error(`Failed to persist audit event ${input.eventType}`, error)
  }
}
