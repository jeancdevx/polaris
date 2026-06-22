# Infraestructura como Código (Terraform)

Estado del repositorio tras el reset:

| Ruta            | Estado                                                     |
| --------------- | ---------------------------------------------------------- |
| `bootstrap/`    | ✅ Operativo — bucket S3 + DynamoDB lock para state remoto |
| `modules/`      | 🔲 Vacío — se crean por fase según `docs/roadmap.md`       |
| `environments/` | 🔲 Vacío — se crea `dev` primero, luego `staging` y `prod` |

## Convenciones

- Un archivo por responsabilidad (no monolitos `main.tf`).
- Módulos propios; referencia
  [Terraform Registry](https://registry.terraform.io/) solo para patrones, no
  para módulos opacos de terceros.
- Región por defecto: `us-east-2` (3 AZ).
- Tags obligatorios: `Project`, `Environment`, `ManagedBy`.

## Orden de creación de módulos

Ver fase 2 en `docs/roadmap.md`.
