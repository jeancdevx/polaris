# Secrets Manager rotation failure

Use this runbook when the `polaris-<env>-secrets-rotation-failed` or
`polaris-<env>-secrets-rotate-api-failed` alert fires.

## Triage

1. Record the secret ARN, rotation version, timestamp, environment, and EventBridge event.
2. Check the rotation Lambda logs and Secrets Manager rotation status. Do not print
   `SecretString`, version values, or credentials.
3. Confirm RDS is healthy and reachable from the rotation Lambda security group.
4. Identify the failed rotation step (`createSecret`, `setSecret`, `testSecret`, or
   `finishSecret`) and whether the current `AWSCURRENT` version still authenticates.
5. Pause dependent deployments if credentials may be inconsistent.

## Recover

1. Fix connectivity, permissions, or Lambda errors before retrying.
2. Retry rotation for the affected secret only.
3. Verify `AWSCURRENT` points to the tested version and applications can reconnect.
4. Confirm the EventBridge alert clears and no authentication-error spike remains.

Do not manually copy credentials into Terraform, CI variables, tickets, or chat.
Escalate if `AWSCURRENT` is unusable or multiple secrets fail together.
