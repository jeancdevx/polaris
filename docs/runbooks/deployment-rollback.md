# Deployment rollback

Use this runbook when an application or infrastructure deployment causes a
regression.

## Application rollback

1. Freeze further deployments and capture the failing image digest, task definition,
   alarms, and logs.
2. Identify the last healthy ECS task definition and immutable image digest.
3. Update the ECS service to the last healthy task definition through the normal,
   approved deployment path.
4. Wait for service stability and verify health endpoints, Kafka lag, error rates,
   and one representative user flow.
5. Revert the source change in a new pull request so declared state matches runtime.

## Terraform rollback

1. Preserve the failed plan/apply output and current state version.
2. Revert the source change in a pull request and review a fresh plan.
3. Confirm the plan contains only intended recovery actions, especially destroys and
   replacements.
4. Apply only after approval; never edit state or run a targeted destroy as a first
   response.
5. Verify alarms, service health, data integrity, and a fresh no-change plan.

For database migrations, use a documented forward fix or tested down migration.
Never restore a database snapshot over a live cluster without incident approval.
