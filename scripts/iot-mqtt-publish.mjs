#!/usr/bin/env node
import fs from 'node:fs'

import mqtt from 'mqtt'

const required = [
  'IOT_ENDPOINT',
  'IOT_CERT_PATH',
  'IOT_KEY_PATH',
  'IOT_CA_PATH',
  'IOT_TOPIC',
  'IOT_PAYLOAD'
]

for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing ${name}`)
    process.exit(1)
  }
}

const endpoint = process.env.IOT_ENDPOINT
const cert = fs.readFileSync(process.env.IOT_CERT_PATH)
const key = fs.readFileSync(process.env.IOT_KEY_PATH)
const ca = fs.readFileSync(process.env.IOT_CA_PATH)
const topic = process.env.IOT_TOPIC
const payload = process.env.IOT_PAYLOAD
const clientId = process.env.IOT_CLIENT_ID ?? 'polaris-iot-simulator'

const client = mqtt.connect(`mqtts://${endpoint}:8883`, {
  cert,
  key,
  ca,
  clientId,
  protocol: 'mqtt',
  rejectUnauthorized: true,
  reconnectPeriod: 0
})

const timeout = setTimeout(() => {
  console.error('Timed out connecting to AWS IoT Core')
  client.end(true)
  process.exit(1)
}, 30_000)

client.on('error', error => {
  clearTimeout(timeout)
  console.error(error.message)
  process.exit(1)
})

client.on('connect', () => {
  client.publish(topic, payload, { qos: 1 }, error => {
    clearTimeout(timeout)
    client.end(true)

    if (error) {
      console.error(error.message)
      process.exit(1)
    }

    console.log(`Published to ${topic}`)
    process.exit(0)
  })
})
