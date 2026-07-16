# AWS access runbook

## Policy

Do not use account-root access keys for development, Terraform, CI or incident
response. Root is reserved for account recovery and operations that explicitly
require root.

## Immediate root-key cleanup

1. Sign in as root through the AWS console with MFA.
2. Open **Security credentials** and delete every root access key.
3. Verify root MFA and account recovery contacts.
4. Enable an AWS Organizations or standalone account contact process as
   appropriate.
5. Review CloudTrail for recent root activity before closing the incident.

This repository intentionally does not automate deletion of root credentials.
Deleting the active key is irreversible and must be confirmed in the console.

## Human access

Use IAM Identity Center (preferred) or an assumable role with short-lived
credentials:

- `polaris-<env>-audit-readonly`: inventory, logs, metrics and plans.
- `polaris-<env>-operator`: explicit operational runbooks; no IAM mutation.
- `polaris-<env>-break-glass`: time-limited, MFA-protected and monitored.

Local profiles must use SSO/role credentials:

```bash
aws sso login --profile polaris-dev-audit
AWS_PROFILE=polaris-dev-audit aws sts get-caller-identity
```

The returned ARN must not end in `:root`.

## Automation access

- GitHub uses OIDC; never store AWS access keys in repository/environment
  secrets.
- The deploy role manages ECR/ECS and can pass only Polaris task roles.
- The Terraform role uses `PowerUserAccess` plus project-prefixed IAM
  management. It must not have `AdministratorAccess`.
- Production environments require reviewers before apply/deploy.

## Quarterly verification

```bash
aws iam get-account-summary
aws iam list-attached-role-policies \
  --role-name polaris-dev-github-terraform-apply
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=root
```

Expected:

- no root access keys;
- no `AdministratorAccess` attachment on Polaris roles;
- root activity only for documented account-level operations.
