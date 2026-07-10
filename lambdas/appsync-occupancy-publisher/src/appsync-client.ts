import { Sha256 } from '@aws-crypto/sha256-js'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'

import { lambdaExecutionCredentials } from './lambda-credentials.js'
import type { OccupancyChangedInput } from './occupancy-event.js'

const publishOccupancyChangedMutation = `
mutation PublishOccupancyChanged($input: OccupancyChangedInput!) {
  publishOccupancyChanged(input: $input) {
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

export type PublishOccupancyChangedResult = Readonly<{
  spotId: string
  zone: string
  status: string
  previousStatus?: string
  deviceId?: string
  sensorType?: string
  occurredAt: string
}>

type GraphQLResponse = Readonly<{
  data?: {
    publishOccupancyChanged?: PublishOccupancyChangedResult
  }
  errors?: ReadonlyArray<{ message: string }>
}>

export const publishOccupancyChanged = async (input: {
  endpoint: string
  region: string
  payload: OccupancyChangedInput
}): Promise<PublishOccupancyChangedResult> => {
  const endpointUrl = new URL(input.endpoint)
  const body = JSON.stringify({
    query: publishOccupancyChangedMutation,
    variables: { input: input.payload }
  })

  const request = new HttpRequest({
    method: 'POST',
    protocol: endpointUrl.protocol,
    hostname: endpointUrl.hostname,
    path: endpointUrl.pathname,
    headers: {
      'Content-Type': 'application/json',
      host: endpointUrl.hostname
    },
    body
  })

  const signer = new SignatureV4({
    credentials: lambdaExecutionCredentials,
    region: input.region,
    service: 'appsync',
    sha256: Sha256
  })

  const signedRequest = await signer.sign(request)
  const response = await fetch(input.endpoint, {
    method: signedRequest.method,
    headers: signedRequest.headers as Record<string, string>,
    body: signedRequest.body
  })

  if (!response.ok) {
    throw new Error(
      `AppSync mutation failed with status ${response.status}: ${await response.text()}`
    )
  }

  const payload = (await response.json()) as GraphQLResponse

  if (payload.errors?.length) {
    throw new Error(
      payload.errors.map(error => error.message).join('; ') ||
        'AppSync mutation returned GraphQL errors'
    )
  }

  const result = payload.data?.publishOccupancyChanged

  if (!result) {
    throw new Error('AppSync mutation returned no publishOccupancyChanged data')
  }

  return result
}
