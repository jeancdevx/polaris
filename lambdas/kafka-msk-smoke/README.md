# kafka-msk-smoke

Lambda on-demand (Fase 2.13) que valida conectividad MSK IAM SASL desde la VPC:
produce y consume un `reservation.created` usando el rol `msk_client`.

Invocar tras deploy:

```bash
pnpm kafka:smoke:msk:dev
```
