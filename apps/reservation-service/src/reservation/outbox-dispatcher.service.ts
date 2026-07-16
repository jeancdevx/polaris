import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit
} from '@nestjs/common'

import type { OutboxEventRow } from '@polaris/database'
import { publishJsonMessage } from '@polaris/kafka'
import type { KafkaTopic } from '@polaris/shared-types'

import { DatabaseService } from './database.service.js'
import { KafkaProducerService } from './kafka-producer.service.js'

@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherService.name)
  private timer: NodeJS.Timeout | undefined
  private stopped = false

  constructor(
    private readonly database: DatabaseService,
    private readonly kafka: KafkaProducerService
  ) {}

  onModuleInit(): void {
    this.schedule(0)
  }

  onModuleDestroy(): void {
    this.stopped = true
    if (this.timer) clearTimeout(this.timer)
  }

  async dispatchBatch(limit = 25): Promise<number> {
    const dataSource = await this.database.getDataSource()
    const rows = await dataSource.transaction(async manager => {
      const claimed = await manager.query<OutboxEventRow[]>(`
        SELECT *
        FROM outbox_events
        WHERE (
          status = 'pending' AND available_at <= NOW()
        ) OR (
          status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes'
        )
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT ${Math.max(1, Math.min(limit, 100))}
      `)

      for (const row of claimed) {
        await manager.query(
          `UPDATE outbox_events
           SET status = 'processing', locked_at = NOW(), attempts = attempts + 1
           WHERE event_id = $1`,
          [row.eventId ?? (row as unknown as { event_id: string }).event_id]
        )
      }
      return claimed
    })

    for (const raw of rows) {
      const row = normalizeRow(raw)
      try {
        await publishJsonMessage(await this.kafka.getProducer(), {
          topic: row.topic as KafkaTopic,
          key: row.partitionKey,
          value: { ...row.payload, eventId: row.eventId }
        })
        await dataSource.getRepository<OutboxEventRow>('OutboxEvent').update(
          { eventId: row.eventId },
          {
            status: 'published',
            publishedAt: new Date(),
            lockedAt: undefined,
            lastError: undefined
          }
        )
        this.logger.log(`Outbox published ${row.topic} eventId=${row.eventId}`)
      } catch (error) {
        const delaySeconds = Math.min(300, 2 ** Math.min(row.attempts + 1, 8))
        const exhausted = row.attempts + 1 >= 10
        await dataSource.query(
          `UPDATE outbox_events
           SET status = $4, locked_at = NULL, last_error = $2,
               available_at = NOW() + ($3 * INTERVAL '1 second')
           WHERE event_id = $1`,
          [
            row.eventId,
            errorMessage(error),
            delaySeconds,
            exhausted ? 'failed' : 'pending'
          ]
        )
        this.logger.error(
          `Outbox publish failed for ${row.eventId}${
            exhausted ? ' and exhausted retries' : ''
          }`,
          error
        )
      }
    }
    return rows.length
  }

  private schedule(delay: number): void {
    if (this.stopped) return
    this.timer = setTimeout(() => {
      void this.dispatchBatch()
        .catch(error => this.logger.error('Outbox poll failed', error))
        .finally(() => this.schedule(1_000))
    }, delay)
    this.timer.unref()
  }
}

const normalizeRow = (row: OutboxEventRow): OutboxEventRow => {
  const raw = row as unknown as Record<string, unknown>
  return {
    eventId: (raw.eventId ?? raw.event_id) as string,
    topic: raw.topic as string,
    partitionKey: (raw.partitionKey ?? raw.partition_key) as string,
    payload: raw.payload as Record<string, unknown>,
    status: raw.status as OutboxEventRow['status'],
    attempts: raw.attempts as number,
    availableAt: (raw.availableAt ?? raw.available_at) as Date,
    lockedAt: (raw.lockedAt ?? raw.locked_at) as Date | undefined,
    publishedAt: (raw.publishedAt ?? raw.published_at) as Date | undefined,
    lastError: (raw.lastError ?? raw.last_error) as string | undefined,
    createdAt: (raw.createdAt ?? raw.created_at) as Date
  }
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message.slice(0, 4_000) : String(error)
