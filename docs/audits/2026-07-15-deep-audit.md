# Polaris deep audit — 2026-07-15

## Scope

End-to-end review of the ESP32 firmware, AWS IoT path, Lambdas, NestJS
services, data stores, event delivery, Terraform, IAM and deployment workflows.
AWS evidence was collected from `dev` using read-only API calls. Secret values
were neither printed nor stored.

## Executive summary

The recent database bootstrap incident was not isolated. Aurora rotates its
managed master password, while most ECS services and database-backed Lambdas
receive a `DATABASE_URL` assembled by Terraform at apply time. Rotation and
consumer refresh are separate, uncoordinated operations. On 2026-07-15 the RDS
secret rotated at 19:40 local time; derived service secrets and tasks were
refreshed at different times. The event processor logged PostgreSQL password
authentication failures at 20:08 while ECS still reported it healthy.

The same systemic pattern appears in state transitions. RDS, Redis, Kafka,
EventBridge, DynamoDB and physical actuators are updated sequentially without a
transactional outbox, durable idempotency or reconciliation. A request may
succeed in one system and silently fail in the next.

The physical path also has correctness and safety gaps. Firmware commands do
not carry durable command IDs, actuator acknowledgements are not correlated,
MQTT publishes are not buffered, and the current actuator changes contain a
GPIO documentation mismatch. Automatic open/close self-tests at boot can move
a real barrier without an explicit operator command.

## Baseline evidence

- `pnpm lint`: passes with 33 warnings.
- `pnpm format:check`: fails on `firmware/esp32/README.md`.
- `pnpm typecheck`: 35/35 tasks pass.
- `pnpm test`: 34/34 tasks pass, but several packages pass with no tests.
- `pnpm build`: passes; Lambda bundles warn about unresolved `expo-sqlite` from
  TypeORM and deprecated Rolldown configuration.
- PlatformIO: all firmware environments compile after installing PlatformIO in
  an isolated temporary environment.
- Integration suite: Docker starts successfully, 2/3 tests pass. The seed
  assertion expects 2 users and 2 RFID tags while the current seed creates 11
  users and 10 tags. Failed setup also causes a secondary teardown exception
  when no container runtime is available.
- Terraform formatting fails on `iac/environments/prod/prod.tfvars`; validation
  is not reached because formatting is chained first.

## Confirmed findings

### P0 — Dynamic RDS credentials are compiled into static configuration

**Evidence**

- Aurora rotation is enabled. The managed secret rotated on 2026-07-15 at
  19:40 local time.
- ECS task definitions for API, admin, reservation and event processor inject
  `DATABASE_URL` from per-service derived secrets.
- Database-backed Lambdas expose `DATABASE_URL` as an environment key.
- The db-bootstrap task is the only consumer currently injecting
  `DB_USERNAME` and `DB_PASSWORD` directly from the RDS-managed secret.
- Event processor logs contain two password-authentication failures immediately
  after the rotation/redeploy window, despite ECS reporting `HEALTHY`.

**Root cause**

Terraform reads the current secret version and serializes it into secondary
secrets or Lambda environment variables. AWS rotates the source independently.
Neither rotation nor secondary-secret changes deterministically replace every
consumer.

**Affected code**

- `iac/modules/ecs/locals.tf`
- `iac/modules/ecs/secrets.tf`
- `iac/modules/ecs/tasks.tf`
- `iac/modules/{rfid-validator,health-checker,reservation-cleanup,appsync-availability}`
- `packages/database/src/config/database-env.ts`

### P0 — Current AWS administration uses root credentials

The local AWS session resolves to the account root. The GitHub Terraform apply
role also has the managed `AdministratorAccess` policy. Read-only audit calls
were allowed; no mutation will be performed with root credentials. IAM account
summary confirms root MFA is enabled but one root access key is still present.

### P0 — Physical barrier can move without an explicit operational command

The current actuator worktree runs an open→close servo self-test automatically
during every boot. A reconnect also reattaches PWM and forces both barriers
closed. These transitions are not correlated with vehicle presence or an
operator command.

Additionally, `pins_actuators.h` uses GPIO 22 for the exit servo, while the
README and serial wiring message state GPIO 16. This can make a correctly wired
servo appear dead.

### P0 — Firmware builds share one mutable device identity file

All PlatformIO environments include the same ignored
`include/polaris_device.h`. That file contains one Thing name and one
certificate at a time. Building `entry_io`, `actuators` and both LED zones
without swapping the file produces valid binaries that all identify as the same
Thing. The IoT policy permits broad topic access, so the incorrect identity can
connect successfully and hide the provisioning mistake.

AWS IoT device logging is not configured, so client-ID/certificate mismatches
and reconnect causes cannot currently be correlated in CloudWatch.

### P0 — Inactive DynamoDB RFID credentials can authorize entry

The DynamoDB-first lookup returns a projected RFID record without applying the
active/expiry validity check used by the RDS path. Because the gate command is
published before Kafka lifecycle processing, a stale or explicitly inactive
projection can operate the physical barrier.

### P1 — RDS, Redis and event state can diverge

- Reservation expiration updates the reservation but does not free the
  `ParkingSpot` row; Redis is freed separately.
- Admin deactivation cancels reservations and frees RDS spots but does not
  update Redis or publish cancellation events.
- Reservation create/cancel commits RDS and Redis before Kafka; Kafka failures
  are logged and swallowed.
- Sensor processing writes DynamoDB before Kafka.
- RFID validation can operate the gate and then silently lose the Kafka event.
- Event processor handlers mutate RDS/Redis before EventBridge and IoT side
  effects, with no durable recovery mechanism.

### P1 — Kafka processing lacks durable idempotency and poison-message policy

The shared consumer parses and invokes handlers directly. A malformed or
transiently failing message can block a partition; retries can repeat physical
or stateful side effects. RFID processing creates new UUIDs during replay,
which defeats downstream duplicate detection.

The database also lacks partial unique constraints for one active reservation
per user/spot and one open parking session per RFID. Concurrent scans can create
duplicate open sessions even before messaging is considered.

### P1 — Health checks report infrastructure health, not functional health

ECS services report steady/healthy while the event processor logs database
authentication failures. The event processor health endpoint does not prove
Kafka group membership or recent consumption. Existing alarms omit MSK
consumer lag, Redis pressure/evictions, Secrets Manager rotation failures and
RDS authentication/connectivity.

### P1 — Deployment ordering is nondeterministic

IaC apply, ECS deploy and db-bootstrap are separate push-triggered workflows.
A change touching infrastructure, schema and application code can race.
Long-running services use `:latest` task images even though CI also pushes SHA
tags. Lambda code deployment is coupled to Terraform path triggers.

### P2 — Infrastructure and documentation drift

- The custom EventBridge bus is named `polaris-events`, not
  `polaris-dev-events`; scheduled rules live on the default bus.
- Staging is referenced by Atlantis/CI but has no complete Terraform root.
- IoT things and policies exist for four devices. The rule API reports
  `ruleDisabled=false`, meaning the rules are enabled; tooling must not label
  that field as `Enabled`.
- IoT private keys are generated by Terraform and therefore reside in state.

### P2 — Test and build gaps hide regressions

- Integration tests are excluded from normal CI.
- The integration seed contract is stale.
- db-bootstrap is absent from the CI Docker matrix.
- Firmware has no CI build or hardware-in-the-loop contract tests.
- Several packages use `passWithNoTests`.

## Target architecture invariants

1. A rotated database credential is consumed live or causes an automatic,
   observable consumer replacement; Terraform never copies the password.
2. A domain state transition and its outbound event are committed atomically
   through an outbox.
3. Every consumed event and physical command has a stable ID and durable
   deduplication.
4. Redis is a derived view of RDS and can be reconciled automatically.
5. “Published” and “physically applied” are distinct states; actuator
   acknowledgements carry the original command ID.
6. Deploy order is IaC → migration/bootstrap → immutable application revision
   → smoke/HIL verification.
7. Health means critical dependencies are ready and event progress is recent.

## Remediation order

1. Remove unsafe automatic actuator movement and align GPIO configuration,
   documentation and diagnostics. Generate a separate ignored credential header
   per PlatformIO environment and verify its Thing name at compile time.
2. Replace copied RDS credentials for ECS and Lambdas; remove root and
   AdministratorAccess usage.
3. Serialize deployment and migration workflows using immutable revisions.
4. Fix reservation expiration/deactivation consistency and add reconciliation.
5. Add transactional outbox, event IDs, consumer idempotency and DLQ policy.
6. Add readiness, rotation/lag/Redis/RDS alarms, drift checks and CI integration.
7. Verify the complete physical chain with supervised hardware-in-the-loop
   scenarios.

## Implementation verification

Repository remediation is implemented but has not been applied to AWS:

- Static copied RDS passwords were removed from ECS and database-backed Lambda
  configuration. Runtime consumers now hydrate the managed RDS secret.
- Release workflows serialize IaC, bootstrap, immutable application deployment
  and health verification.
- Reservation transitions use an outbox; consumers use durable event IDs;
  Redis can be reconciled from RDS.
- Firmware no longer moves barriers at boot/reconnect, uses per-target
  credential headers, validates Thing identity, correlates commands and retries
  close commands until a matching acknowledgement arrives.
- IoT policies are scoped by device role, IoT error logging is configured, and
  operational alarms/runbooks cover rotation, Kafka, Redis, RDS and readiness.

Local verification after remediation:

- lint passes with pre-existing warnings;
- formatting, Actionlint, TypeScript (35/35), unit tests (34/34), production
  build (25/25), Terraform formatting and dev/prod validation pass;
- all five PlatformIO environments compile;
- the integration harness now fails cleanly, but execution remains unavailable
  because this workstation has no Docker daemon.

External closure remains intentionally gated:

- the current AWS credentials are still account-root and one root access key
  exists, so no apply or deployment was performed;
- GitHub environment protection could not be inspected because authenticated
  GitHub CLI access is unavailable;
- firmware was not flashed and barrier motion was not attempted without a
  physically present operator.

## Safety constraints for physical validation

- Servo movement requires an operator physically present.
- Validate GPIO, external 5 V supply and common ground before flashing.
- Keep the barrier mechanically disconnected during first boot after firmware
  changes.
- Test close/open limits at low load before reconnecting the barrier arm.
- Never rotate/revoke an active IoT certificate until a replacement firmware
  image is ready for that exact Thing.
