# kafka-topic-creator

Lambda Node.js 24 que crea los 8 topics MSK definidos en
`@polaris/shared-types`.

- Build: Rolldown (`pnpm --filter @polaris/kafka-topic-creator build`)
- Auth MSK: `aws-msk-iam-sasl-signer-js` + KafkaJS admin API
- Logs: `@polaris/lambda-core` (Powertools Logger + X-Ray Tracer)
- Idempotente: solo crea topics que no existen
