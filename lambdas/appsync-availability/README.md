# appsync-availability

Lambda resolver para AppSync `Query.availability`. Lee ocupación desde Redis
(con fallback RDS), misma lógica que `GET /parking/availability` en api-service.

```bash
pnpm --filter @polaris/appsync-availability build
pnpm appsync:smoke:dev
```
