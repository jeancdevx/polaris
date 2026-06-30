import {
  EventBridgeClient,
  PutEventsCommand,
  type PutEventsRequestEntry
} from '@aws-sdk/client-eventbridge'

import { EVENTBRIDGE_SOURCE_EVENT_PROCESSOR } from '../constants.js'

export type PublishEventBridgeEntryInput = Readonly<{
  source?: string
  detailType: string
  detail: Record<string, unknown>
  busName: string
}>

export class EventBridgePublishError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EventBridgePublishError'
  }
}

export const publishEventBridgeEntry = async (
  client: EventBridgeClient,
  input: PublishEventBridgeEntryInput
): Promise<void> => {
  const entry: PutEventsRequestEntry = {
    Source: input.source ?? EVENTBRIDGE_SOURCE_EVENT_PROCESSOR,
    DetailType: input.detailType,
    Detail: JSON.stringify(input.detail),
    EventBusName: input.busName
  }

  const response = await client.send(
    new PutEventsCommand({
      Entries: [entry]
    })
  )

  const failedEntry = response.Entries?.find(result => result.ErrorCode)

  if (failedEntry?.ErrorCode) {
    throw new EventBridgePublishError(
      `${failedEntry.ErrorCode}: ${failedEntry.ErrorMessage ?? 'PutEvents failed'}`
    )
  }
}
