# Módulos Terraform

Se crean incrementalmente. No agregar módulos adelantados al código de
aplicación.

Módulos planificados:

1. `vpc` ✅
2. `security-groups` ✅
3. **`iam`** ✅
4. `rds` ✅
5. `redis` ✅
6. `kafka` (Amazon MSK) ✅
7. `cognito` ✅
8. `dynamodb` ✅
9. `s3`
10. `ecs`
11. `ecr`
12. `api-gateway`
13. `lambda`
14. `eventbridge`
15. `sqs`
16. `iot-core`
17. `appsync`
18. `secrets-manager`
19. `observability` (CloudWatch dashboards/alarms)
20. `edge` (Route53, CloudFront, WAF — solo staging/prod)

## Convenciones

- Un archivo por responsabilidad (`user-pool.tf`, `subnets.tf`, …); no monolitos
  `main.tf`.
- Archivos base: `versions.tf`, `variables.tf`, `outputs.tf`, `locals.tf` (si
  aplica).
- Permisos IAM solo en el módulo `iam`; el resto consume outputs/ARNs.
- Sin comentarios en el HCL de módulos; documentar en el `README.md` del módulo.
- Implementación según skills Terraform del repo y alineada con
  `docs/arquitectura.md` + `docs/flujos.md`.
