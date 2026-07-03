import { encodeBase64 } from '@/lib/encoding/base64'
import type { OccupancyChangedEvent } from '@/lib/parking/occupancy'

const ON_OCCUPANCY_CHANGED = `
subscription OnOccupancyChanged {
  onOccupancyChanged {
    spotId
    zone
    status
    previousStatus
    deviceId
    sensorType
    occurredAt
  }
}
`.trim()

export type OccupancySubscriptionHandle = Readonly<{
  close: () => void
}>

type SubscriptionCallbacks = Readonly<{
  onEvent: (event: OccupancyChangedEvent) => void
  onError?: (error: unknown) => void
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Cliente mínimo del protocolo realtime de AppSync (graphql-ws sobre WebSocket
 * con auth Cognito User Pools). El header de auth va en el query string de la
 * conexión y en extensions.authorization de cada subscripción.
 */
export const subscribeToOccupancy = (config: {
  graphqlEndpoint: string
  realtimeEndpoint: string
  accessToken: string
  callbacks: SubscriptionCallbacks
}): OccupancySubscriptionHandle => {
  const graphqlHost = new URL(config.graphqlEndpoint).host
  const authorization = {
    host: graphqlHost,
    Authorization: config.accessToken
  }

  const header = encodeBase64(JSON.stringify(authorization))
  const payload = encodeBase64('{}')
  const url = `${config.realtimeEndpoint}?header=${header}&payload=${payload}`

  const subscriptionId = `occupancy-${Date.now()}`
  let closedByClient = false

  const ws = new WebSocket(url, 'graphql-ws')

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'connection_init' }))
  }

  ws.onmessage = messageEvent => {
    let message: unknown

    try {
      message = JSON.parse(String(messageEvent.data))
    } catch {
      return
    }

    if (!isRecord(message)) {
      return
    }

    if (message.type === 'connection_ack') {
      ws.send(
        JSON.stringify({
          id: subscriptionId,
          type: 'start',
          payload: {
            data: JSON.stringify({ query: ON_OCCUPANCY_CHANGED }),
            extensions: { authorization }
          }
        })
      )
      return
    }

    if (message.type === 'error' || message.type === 'connection_error') {
      config.callbacks.onError?.(message)
      return
    }

    if (message.type !== 'data' || message.id !== subscriptionId) {
      return
    }

    const dataPayload = isRecord(message.payload)
      ? message.payload.data
      : undefined
    const change = isRecord(dataPayload)
      ? dataPayload.onOccupancyChanged
      : undefined

    if (isRecord(change) && typeof change.spotId === 'string') {
      config.callbacks.onEvent(change as OccupancyChangedEvent)
    }
  }

  ws.onerror = errorEvent => {
    if (!closedByClient) {
      config.callbacks.onError?.(errorEvent)
    }
  }

  return {
    close: () => {
      closedByClient = true

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ id: subscriptionId, type: 'stop' }))
      }

      ws.close()
    }
  }
}
