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
  onConnected?: () => void
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Cliente mínimo del protocolo realtime de AppSync (graphql-ws sobre WebSocket
 * con auth Cognito User Pools). AppSync espera el ID token de Cognito en
 * Authorization (no el access token).
 */
export const subscribeToOccupancy = (config: {
  graphqlEndpoint: string
  realtimeEndpoint: string
  idToken: string
  callbacks: SubscriptionCallbacks
}): OccupancySubscriptionHandle => {
  const graphqlHost = new URL(config.graphqlEndpoint).host
  const authorization = {
    host: graphqlHost,
    Authorization: config.idToken
  }

  const header = encodeBase64(JSON.stringify(authorization))
  const payload = encodeBase64('{}')
  const url = `${config.realtimeEndpoint}?header=${header}&payload=${payload}`

  const subscriptionId = `occupancy-${Date.now()}`
  let closedByClient = false
  let errorNotified = false

  const notifyError = (error: unknown) => {
    if (closedByClient || errorNotified) {
      return
    }
    errorNotified = true
    config.callbacks.onError?.(error)
  }

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
      config.callbacks.onConnected?.()
      return
    }

    if (message.type === 'error' || message.type === 'connection_error') {
      notifyError(message)
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
    notifyError(errorEvent)
  }

  ws.onclose = () => {
    notifyError(new Error('AppSync WebSocket closed'))
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
