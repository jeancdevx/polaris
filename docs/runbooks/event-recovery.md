# Event delivery recovery

Use this runbook when an outbox event exhausts retries, Kafka lag stops
advancing, or a consumer repeatedly fails the same message.

## Diagnose

1. Record the event ID, topic, partition/key, first failure time, and affected
   reservation or parking spot.
2. Inspect service logs and dependency health without changing offsets.
3. For reservation outbox failures, query only metadata:

   ```sql
   SELECT event_id, topic, status, attempts, available_at, last_error, created_at
   FROM outbox_events
   WHERE status = 'failed'
   ORDER BY created_at;
   ```

4. Confirm whether the domain transition committed in RDS and whether Redis,
   Kafka, EventBridge, and the physical device observed the event.

## Recover

Fix the dependency or payload defect first. Then retry one verified outbox row:

```sql
UPDATE outbox_events
SET status = 'pending',
    attempts = 0,
    available_at = NOW(),
    locked_at = NULL,
    last_error = NULL
WHERE event_id = '<verified-event-id>'
  AND status = 'failed';
```

Do not delete `consumed_events` merely to force replay. A replay can repeat
external side effects. If replay is unavoidable, confirm that every affected
handler is idempotent and that actuator commands retain the original command
ID.

## Close

Verify that the outbox row becomes `published`, consumer progress resumes, and
RDS-to-Redis reconciliation reports no drift. Preserve the event ID and
timeline in the incident record.
