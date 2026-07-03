# Polaris Mobile

App móvil (Expo SDK 57 + expo-router) para usuarios del estacionamiento: escena
**3D** del parking en tiempo real y reserva/cancelación de plazas.

## Qué hace

- **Escena 3D** (`three` + `@react-three/fiber/native` + `@react-three/drei`
  sobre `expo-gl`): diez plazas en dos filas (zona A `spot-01..05`, zona B
  `spot-06..10`). Vista aérea con **OrbitControls** (arrastrar, zoom, rotación
  limitada). Toca una plaza para reservar o cancelar.
- **Login** contra `POST /auth/signin` de la API pública (Cognito vía
  api-service).
- **Disponibilidad** inicial con `GET /parking/availability` y tiempo real con
  `onOccupancyChanged` vía AppSync WebSocket.
- **Reservar** / **cancelar** plazas (Flujos 13–14).

## Ejecutar

```bash
pnpm mobile:env:dev
pnpm mobile:dev
```

## UI

Tema claro neutral alineado con `web-admin` (shadcn Lyra). Overlay compacto
arriba y abajo para no bloquear gestos en el canvas 3D.

## Estructura

- `src/app/` — rutas: `login`, `parking`
- `src/components/scene/` — Canvas R3F, controles de cámara, plazas, carros
- `src/components/ui/` — stats, badge en vivo, hoja de acciones
- `src/lib/` — auth, API, realtime AppSync, layout 3D
