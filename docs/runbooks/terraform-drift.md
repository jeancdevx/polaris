# Terraform drift

The scheduled `Terraform drift detection` workflow runs a refresh-only,
read-only plan for implemented environments and fails when it finds a diff.
It never applies changes.

## Triage

1. Open the failed job and preserve the plan output.
2. Separate expected external changes from unauthorized or accidental changes.
3. Check CloudTrail for the actor, time, and API call that changed the resource.
4. Assess security and availability impact before reconciling state.

## Reconcile

- If the live change is wrong, change it through Terraform and a reviewed plan.
- If the live change is intended, update Terraform source and review the resulting
  plan.
- If the provider reports a harmless computed-value difference, document and
  narrowly normalize it; do not add broad `ignore_changes`.

Re-run the workflow and require a no-change plan before closing the incident.
Do not run `apply`, import resources, or edit state from the drift workflow.
