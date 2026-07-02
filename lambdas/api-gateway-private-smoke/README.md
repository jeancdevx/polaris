# api-gateway-private-smoke

Lambda en VPC que verifica el API Gateway privado:

1. `GET /admin/users` sin JWT → `401` (authorizer Cognito)
2. `GET /internal/parking/status` → `4xx` (ruta proxy al ALB; handler pendiente)

Invocar con `pnpm api-gateway-private:smoke:dev`.
