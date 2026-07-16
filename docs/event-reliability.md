# Event reliability

RDS-backed reservation transitions write their domain event to
`outbox_events` in the same transaction. The reservation service dispatcher
claims rows with `FOR UPDATE SKIP LOCKED`, publishes them with the stable
outbox `event_id`, and retries failures with bounded exponential backoff.
After ten attempts the row becomes `failed` instead of retrying forever; the
failed row and `last_error` must be investigated before an operator returns it
to `pending`.
Consumers store that event ID (or the Kafka topic/partition/offset fallback)
in `consumed_events` before performing critical handlers. Completed IDs are
skipped. A `processing` claim is retried only after its five-minute lease is
stale, preventing a crashed consumer from blocking an event permanently.

Malformed Kafka messages retry by default. A consumer may explicitly choose
`skip` with a reporting callback, or `dead-letter` with a callback that must
successfully persist/publish the poison message before its offset can advance.
Handler errors are never treated as malformed and remain retryable.

## Deliberate distributed-transaction limits

Redis is a projection of RDS and cannot participate in the PostgreSQL
transaction. Request paths still update it for low latency, cancellation
events repair it idempotently, and `pnpm db:sync-redis` performs full
RDS-to-Redis reconciliation (including removal of stale hash fields).

The RFID validator can publish an IoT gate command before Kafka is available;
DynamoDB/IoT/Kafka do not share a transaction. It retries Kafka three times,
logs each failure with the gate result, and then fails the Lambda invocation
so the source event remains retryable. This can duplicate an idempotent gate
command, but it no longer reports a gate-open decision as fully processed
without the corresponding durable event.
