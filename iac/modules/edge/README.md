# edge — galaxymorph.com (Fase 9.1)

Perímetro público para staging y prod: CloudFront + WAF + Route 53 + ACM.

## Dominios por entorno

| Servicio        | prod                        | staging                             |
| --------------- | --------------------------- | ----------------------------------- |
| API pública     | `api.galaxymorph.com`       | `staging-api.galaxymorph.com`       |
| API admin       | `admin-api.galaxymorph.com` | `staging-admin-api.galaxymorph.com` |
| Web-admin (S3)  | `admin.galaxymorph.com`     | `staging-admin.galaxymorph.com`     |
| AppSync GraphQL | `graphql.galaxymorph.com`   | `staging-graphql.galaxymorph.com`   |
| Cognito UI      | `auth.galaxymorph.com`      | `staging-auth.galaxymorph.com`      |
| Atlantis        | `atlantis.galaxymorph.com`  | `staging-atlantis.galaxymorph.com`  |

## Dos API Gateways

| API     | Módulo                | CloudFront    | Rutas típicas              |
| ------- | --------------------- | ------------- | -------------------------- |
| Pública | `api-gateway`         | `api.*`       | mobile, parking, reservas  |
| Admin   | `api-gateway-private` | `admin-api.*` | `/admin/*`, `/internal/*`¹ |

¹ `/internal` bloqueado por WAF regional en el dominio público; en dev sigue
accesible por `execute-api` o desde la VPC.

## Seguridad API

```
Cliente → CloudFront (WAF global) → API GW custom domain
         ↳ header X-Origin-Verify (Secrets Manager)
WAF regional en cada API GW: bloquea todo excepto peticiones con ese header
```

## Variables principales

| Variable                | Descripción                                |
| ----------------------- | ------------------------------------------ |
| `base_domain`           | `galaxymorph.com`                          |
| `hosted_zone_id`        | Zone ID Route 53 (`Z0437101YIMTM4WCJEKJ`)  |
| `api_gateway_id`        | HTTP API **pública**                       |
| `admin_api_gateway_id`  | HTTP API **admin** (`api-gateway-private`) |
| `appsync_api_id`        | AppSync (custom domain `graphql.*`)        |
| `cognito_user_pool_id`  | Cognito hosted UI (`auth.*`)               |
| `assets_bucket_name`    | Bucket static web-admin                    |
| `atlantis_alb_dns_name` | ALB Atlantis (vacío = sin CF Atlantis)     |

## Wiring en staging/prod

1. `module.api_gateway_private` con `disable_execute_api_endpoint = true`
2. `module.s3` con `manage_assets_bucket_policy = false` cuando edge gestiona
   OAC
3. `provider aws.us_east_1` en `providers.tf`
4. CORS en API pública: `https://admin.{domain}`
5. Web-admin: `ADMIN_API_URL=https://admin-api.galaxymorph.com`
6. Mobile: `EXPO_PUBLIC_API_URL=https://api.galaxymorph.com`

## Recursos

| Archivo                       | Contenido                                  |
| ----------------------------- | ------------------------------------------ |
| `acm.tf`                      | Certificados regional + us-east-1          |
| `origin-secret.tf`            | Secreto `X-Origin-Verify`                  |
| `waf-cloudfront.tf`           | WAF global                                 |
| `waf-api.tf`                  | WAF regional API pública                   |
| `waf-admin-api.tf`            | WAF regional API admin (+ block /internal) |
| `api-gateway-domain.tf`       | Dominio custom API pública                 |
| `admin-api-gateway-domain.tf` | Dominio custom API admin                   |
| `public-api-distribution.tf`  | CloudFront API pública                     |
| `admin-api-distribution.tf`   | CloudFront API admin                       |
| `web-distribution.tf`         | CloudFront web-admin S3                    |
| `atlantis-distribution.tf`    | CloudFront Atlantis                        |
| `appsync-domain.tf`           | AppSync custom domain                      |
| `cognito-auth-domain.tf`      | Cognito custom domain                      |
| `route53-records.tf`          | Alias A/AAAA                               |
| `s3-assets-policy.tf`         | OAC web-admin                              |
