# Infraestructura como Código (Terraform)

Estado del repositorio tras el reset:

| Ruta            | Estado                                                     |
| --------------- | ---------------------------------------------------------- |
| `bootstrap/`    | ✅ Operativo — bucket S3 + DynamoDB lock para state remoto |
| `modules/`      | 🟡 En progreso — `vpc` (Fase 2.1)                          |
| `environments/` | 🔲 Vacío — se crea `dev` primero, luego `staging` y `prod` |

## Convenciones

- Un archivo por responsabilidad (no monolitos `main.tf`); p. ej.
  `cognito/user-pool.tf`, `vpc/subnets.tf`.
- Archivos base por módulo: `versions.tf`, `variables.tf`, `outputs.tf`,
  `locals.tf`.
- Permisos IAM centralizados en `modules/iam/`; los demás módulos no crean
  roles/policies propias.
- Sin comentarios en el HCL de `modules/*`; documentación en el README de cada
  módulo.
- Skills Terraform del repo (`terraform-style-guide`,
  `terraform-module-library`, …) en cada módulo.
- Alineación con `docs/arquitectura.md` y `docs/flujos.md`.
- Módulos propios; referencia
  [Terraform Registry](https://registry.terraform.io/) solo para patrones, no
  para módulos opacos de terceros.
- Región por defecto: `us-east-2` (3 AZ).
- Tags obligatorios: `Project`, `Environment`, `ManagedBy`.

## Orden de creación de módulos

Ver fase 2 en `docs/roadmap.md`.
