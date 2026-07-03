# edge — galaxymorph.com (Fase 9.1)

#

# Dominios por entorno:

# prod: api.galaxymorph.com, admin.galaxymorph.com, atlantis.galaxymorph.com

# staging: staging-api.galaxymorph.com, staging-admin._, staging-atlantis._

#

# Seguridad API:

# Cliente → CloudFront (WAF global) → API GW custom domain

# CloudFront envía header X-Origin-Verify (secreto en Secrets Manager)

# WAF regional en API GW: bloquea todo excepto peticiones con ese header

# Llamadas directas a execute-api o al dominio regional sin header → 403

terraform { required_providers { aws = { source = "hashicorp/aws" version = "~>
6.0" configuration_aliases = [aws.us_east_1] } random = { source =
"hashicorp/random" version = "~> 3.0" } } }

## Variables

| Variable                          | Descripción                            |
| --------------------------------- | -------------------------------------- |
| `base_domain`                     | `galaxymorph.com`                      |
| `hosted_zone_id`                  | Zone ID de Route 53                    |
| `api_gateway_id`                  | HTTP API pública                       |
| `assets_bucket_name`              | Bucket static web-admin                |
| `assets_bucket_https_policy_json` | Policy base del módulo s3              |
| `atlantis_alb_dns_name`           | ALB Atlantis (vacío = sin CF Atlantis) |

## Wiring en staging/prod

1. `module.s3` con `manage_assets_bucket_policy = false` cuando `module.edge`
   gestiona la policy.
2. `provider aws.us_east_1` en `providers.tf`.
3. Actualizar `module.api_gateway` `cors_allow_origins` con
   `https://admin.{domain}`.
4. Mobile/web-admin env: `EXPO_PUBLIC_API_URL=https://api.galaxymorph.com` (o
   staging-api).
5. Atlantis: webhook GitHub → `https://staging-atlantis.galaxymorph.com/events`.

## Recursos

| Archivo                 | Contenido                                      |
| ----------------------- | ---------------------------------------------- |
| `acm.tf`                | Certificados regional + us-east-1 (CloudFront) |
| `origin-secret.tf`      | Secreto `X-Origin-Verify`                      |
| `waf-cloudfront.tf`     | WAF global (rate limit + managed rules)        |
| `waf-api.tf`            | WAF regional (solo header CloudFront)          |
| `api-gateway-domain.tf` | Dominio custom API GW                          |
| `cloudfront.tf`         | Distribuciones API, web, Atlantis              |
| `route53-records.tf`    | Alias A/AAAA                                   |
| `s3-assets-policy.tf`   | OAC web-admin                                  |

## Pendiente (fases siguientes)

- AppSync custom domain / `graphql.*` vía CloudFront
  (`enable_graphql_cloudfront`)
- Cognito hosted UI `auth.galaxymorph.com`
- API Gateway privada (admin BFF): mantener VPC-only o exponer ruta `/admin`
  solo vía CloudFront
- Restringir Atlantis ALB a prefijos IP de CloudFront (security group)
