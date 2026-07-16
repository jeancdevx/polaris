import type { DataSource } from 'typeorm'

import type { ConsumedEventRow } from '../entities/schemas/consumed-event.schema.js'

export type ConsumedEventIdentity = Readonly<{
  consumerName: string
  eventId: string
  topic: string
  partition: number
  offset: string
}>

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

export const processConsumedEventOnce = async (
  dataSource: DataSource,
  identity: ConsumedEventIdentity,
  handler: () => Promise<void>
): Promise<'processed' | 'duplicate'> => {
  const claimedRows = await dataSource.query<Array<{ status: string }>>(
    `INSERT INTO consumed_events (
       consumer_name, event_id, topic, partition, offset, status
     ) VALUES ($1, $2, $3, $4, $5, 'processing')
     ON CONFLICT (consumer_name, event_id) DO UPDATE
       SET topic = EXCLUDED.topic,
           partition = EXCLUDED.partition,
           offset = EXCLUDED.offset,
           status = 'processing',
           processed_at = NULL,
           created_at = NOW()
       WHERE consumed_events.status = 'processing'
         AND consumed_events.created_at < NOW() - INTERVAL '5 minutes'
     RETURNING status`,
    [
      identity.consumerName,
      identity.eventId,
      identity.topic,
      identity.partition,
      identity.offset
    ]
  )

  if (claimedRows.length === 0) {
    // Another in-flight attempt (often after a Kafka rebalance). Wait briefly
    // for completion instead of throwing immediately and poisoning the consumer.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const existing = await dataSource
        .getRepository<ConsumedEventRow>('ConsumedEvent')
        .findOne({
          where: {
            consumerName: identity.consumerName,
            eventId: identity.eventId
          }
        })

      if (existing?.status === 'completed') {
        return 'duplicate'
      }

      if (!existing) {
        break
      }

      await sleep(500)
    }

    const existing = await dataSource
      .getRepository<ConsumedEventRow>('ConsumedEvent')
      .findOne({
        where: {
          consumerName: identity.consumerName,
          eventId: identity.eventId
        }
      })

    if (existing?.status === 'completed') {
      return 'duplicate'
    }

    throw new Error(
      `Event ${identity.eventId} is already being processed by ${identity.consumerName}`
    )
  }

  try {
    await handler()
    await dataSource.getRepository<ConsumedEventRow>('ConsumedEvent').update(
      {
        consumerName: identity.consumerName,
        eventId: identity.eventId
      },
      { status: 'completed', processedAt: new Date() }
    )
    return 'processed'
  } catch (error) {
    await dataSource.getRepository<ConsumedEventRow>('ConsumedEvent').delete({
      consumerName: identity.consumerName,
      eventId: identity.eventId
    })
    throw error
  }
}
