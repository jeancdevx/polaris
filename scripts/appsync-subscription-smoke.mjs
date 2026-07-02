import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const graphqlEndpoint = process.env.APPSYNC_GRAPHQL_ENDPOINT
const realtimeEndpoint = process.env.APPSYNC_REALTIME_ENDPOINT
const apiKey = process.env.APPSYNC_API_KEY
const publisherFunctionName =
  process.env.APPSYNC_OCCUPANCY_PUBLISHER_FUNCTION_NAME

if (
  !graphqlEndpoint ||
  !realtimeEndpoint ||
  !apiKey ||
  !publisherFunctionName
) {
  console.error(
    'Missing APPSYNC_GRAPHQL_ENDPOINT, APPSYNC_REALTIME_ENDPOINT, APPSYNC_API_KEY, or APPSYNC_OCCUPANCY_PUBLISHER_FUNCTION_NAME'
  )
  process.exit(1)
}

const graphqlHost = new URL(graphqlEndpoint).host
const subscriptionId = randomUUID()
const smokeSpotId = 'spot-03'
const smokeZone = 'a'

const authorization = {
  host: graphqlHost,
  'x-api-key': apiKey
}

const subscriptionPayload = {
  query: `
    subscription OnOccupancyChanged($zone: String) {
      onOccupancyChanged(zone: $zone) {
        spotId
        zone
        status
        previousStatus
        occurredAt
      }
    }
  `.trim(),
  variables: { zone: smokeZone }
}

const eventPayload = {
  source: 'polaris.event-processor',
  'detail-type': 'sensor.occupancy',
  time: new Date().toISOString(),
  detail: {
    eventName: 'sensor.occupancy',
    aggregateId: `evt-smoke-${randomUUID()}`,
    occurredAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    parkingSpotId: smokeSpotId,
    previousStatus: 'free',
    currentStatus: 'occupied',
    deviceId: 'sensor-smoke-001',
    sensorType: 'ultrasonic'
  }
}

const invokePublisher = () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'appsync-subscription-smoke-'))
  const outputFile = join(outputDir, 'response.json')

  try {
    execFileSync(
      'aws',
      [
        'lambda',
        'invoke',
        '--function-name',
        publisherFunctionName,
        '--cli-binary-format',
        'raw-in-base64-out',
        '--payload',
        JSON.stringify(eventPayload),
        outputFile
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    )

    const response = JSON.parse(readFileSync(outputFile, 'utf8'))

    if (response.published !== true || response.parkingSpotId !== smokeSpotId) {
      throw new Error(
        `Publisher returned unexpected payload: ${JSON.stringify(response)}`
      )
    }
  } finally {
    rmSync(outputDir, { recursive: true, force: true })
  }
}

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(
      new Error('Timed out waiting for onOccupancyChanged subscription event')
    )
  }, 30_000)

  const ws = new WebSocket(realtimeEndpoint)

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'connection_init', payload: authorization }))
  })

  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data))

    if (message.type === 'connection_ack') {
      ws.send(
        JSON.stringify({
          type: 'start',
          id: subscriptionId,
          payload: {
            data: JSON.stringify(subscriptionPayload),
            extensions: { authorization }
          }
        })
      )

      setTimeout(() => {
        try {
          invokePublisher()
        } catch (error) {
          clearTimeout(timeout)
          ws.close()
          reject(error)
        }
      }, 1_000)

      return
    }

    if (message.type === 'error') {
      clearTimeout(timeout)
      ws.close()
      reject(
        new Error(`AppSync subscription error: ${JSON.stringify(message)}`)
      )
      return
    }

    if (message.type !== 'data' || message.id !== subscriptionId) {
      return
    }

    const payload = JSON.parse(message.payload.data)
    const change = payload?.data?.onOccupancyChanged

    if (
      change?.spotId === smokeSpotId &&
      change?.zone === smokeZone &&
      change?.status === 'occupied'
    ) {
      clearTimeout(timeout)
      ws.send(JSON.stringify({ type: 'stop', id: subscriptionId }))
      ws.close()
      resolve(undefined)
    }
  })

  ws.addEventListener('error', error => {
    clearTimeout(timeout)
    reject(error)
  })

  ws.addEventListener('close', () => {
    clearTimeout(timeout)
  })
})

console.log('AppSync onOccupancyChanged subscription smoke test passed.')
