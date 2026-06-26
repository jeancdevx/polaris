# Entorno dev

Prerequisito: `iac/bootstrap` aplicado y bucket S3 de state disponible.

## Inicialización

1. Copiar `terraform.tfvars.example` → `terraform.tfvars` y ajustar
   `aws_profile`.
2. En `backend.tf`, reemplazar `REPLACE_WITH_BOOTSTRAP_OUTPUT_state_bucket_name`
   con el output `state_bucket_name` del bootstrap.
3. Ejecutar:

```bash
cd iac/environments/dev
terraform init
terraform plan
```

## Módulos desplegados

| Fase | Módulo | Estado |
| ---- | ------ | ------ |
| 2.1  | `vpc`  | ✅     |
