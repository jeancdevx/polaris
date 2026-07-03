# Polaris Mobile

App móvil (Expo SDK 57 + expo-router) para usuarios del estacionamiento:
simulación 3D del parking en tiempo real y reserva/cancelación de plazas.

## Qué hace

- **Simulación 3D** (`three` + `@react-three/fiber` sobre `expo-gl`): las diez
  plazas en dos filas (zona A `spot-01..05`, zona B `spot-06..10`). Las plazas
  ocupadas muestran un carro low-poly con color determinístico por plaza; las
  reservadas muestran un carro holograma que parpadea cada 500 ms, como el LED
  verde de la plaza física (Flujo 12).
- **Login** contra `POST /auth/signin` de la API pública (Cognito vía
  api-service). Tokens en `expo-secure-store`, refresh con `POST /auth/refresh`.
- **Disponibilidad** inicial con `GET /parking/availability` (Flujo 23) y tiempo
  real con la subscription `onOccupancyChanged` de AppSync (WebSocket con auth
  Cognito).
- **Reservar** una plaza libre: `POST /parking/reserve` con
  `{ parkingSpotId, reservationDate }` y JWT (Flujo 13).
- **Cancelar** la reserva propia: `DELETE /parking/reserve/{id}` (Flujo 14).

## Ejecutar

```bash
# genera apps/mobile/.env desde los outputs de Terraform (dev)
pnpm mobile:env:dev

# arranca Metro; abre en Expo Go o dev build
pnpm mobile:dev
```

Variables (ver `.env.example`):

| Variable                                | Origen (terraform output)   |
| --------------------------------------- | --------------------------- |
| `EXPO_PUBLIC_API_URL`                   | `api_gateway_endpoint`      |
| `EXPO_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT`  | `appsync_graphql_endpoint`  |
| `EXPO_PUBLIC_APPSYNC_REALTIME_ENDPOINT` | `appsync_realtime_endpoint` |
| `EXPO_PUBLIC_AWS_REGION`                | región del despliegue       |

## Estructura

- `src/app/` — rutas expo-router: `login`, `parking` (escena 3D + overlay).
- `src/components/scene/` — Canvas R3F: parking, carros, plazas, farolas.
- `src/components/ui/` — chips de stats, badge en vivo, hoja de acciones.
- `src/lib/` — auth (REST + secure store), API de reservas, cliente realtime
  AppSync, lógica de ocupación y layout 3D (con tests unitarios).

## Notas

- No usa Amplify: auth y reservas van por la API pública ya existente y la
  subscription usa el protocolo realtime de AppSync directamente, así la app
  corre en Expo Go sin módulos nativos extra.
- La identidad del usuario (`preferred_username` del idToken) se usa para
  resaltar "mi plaza" en el mapa: la API de availability expone `userId` por
  plaza cuando está reservada u ocupada.
