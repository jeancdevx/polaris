# @polaris/lambda-core

Utilidades compartidas para Lambdas Node.js 24 basadas en
[Powertools for AWS Lambda (TypeScript)](https://docs.aws.amazon.com/powertools/typescript/latest/).

## Exports

| Función                      | Powertools      | Uso                                       |
| ---------------------------- | --------------- | ----------------------------------------- |
| `instrumentLambdaHandler`    | Logger + Tracer | Wrapper estándar de handlers              |
| `createPolarisLambdaLogger`  | Logger          | Logs JSON estructurados + contexto Lambda |
| `createPolarisLambdaMetrics` | Metrics         | EMF → CloudWatch (`namespace: Polaris`)   |
| `createPolarisLambdaTracer`  | Tracer          | Subsegmentos X-Ray                        |

## Uso

```typescript
import { instrumentLambdaHandler } from '@polaris/lambda-core'

export const handler = instrumentLambdaHandler(
  { serviceName: 'rfid-validator' },
  async (event, _context, logger) => {
    logger.info('Processing RFID event', { event })
    return { ok: true }
  }
)
```

## Variables de entorno (Terraform)

| Variable                       | Descripción                        |
| ------------------------------ | ---------------------------------- |
| `POWERTOOLS_SERVICE_NAME`      | Nombre del servicio en logs/traces |
| `POWERTOOLS_LOG_LEVEL`         | `INFO` (dev/staging/prod)          |
| `POWERTOOLS_METRICS_NAMESPACE` | `Polaris`                          |

Ver matriz completa en `docs/arquitectura.md` §12.1.
