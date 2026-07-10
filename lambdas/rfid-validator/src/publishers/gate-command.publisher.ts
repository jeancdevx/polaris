import {
  IoTDataPlaneClient,
  PublishCommand
} from '@aws-sdk/client-iot-data-plane'

import type { RfidScanEvent } from '../iot-event.js'
import type { RfidValidatorEnv } from '../read-env.js'
import {
  displayMessageForAllowed,
  displayMessageForDenied
} from './display-messages.js'

export type GateCommandContext = Readonly<{
  scan: RfidScanEvent
  accessType?: 'reserved' | 'walk_in'
  parkingSpotId?: string
  reason?: string
}>

export class GateCommandPublisher {
  private readonly client?: IoTDataPlaneClient

  constructor(private readonly env: RfidValidatorEnv) {
    if (env.gateCommandsEnabled && env.iotDataEndpoint) {
      this.client = new IoTDataPlaneClient({
        region:
          process.env.AWS_REGION ??
          process.env.AWS_DEFAULT_REGION ??
          'us-east-1',
        endpoint: env.iotDataEndpoint
      })
    }
  }

  async publishAllowed(context: GateCommandContext): Promise<boolean> {
    if (!this.client) {
      return false
    }

    const display = displayMessageForAllowed({
      readerLocation: context.scan.readerLocation,
      accessType: context.accessType,
      parkingSpotId: context.parkingSpotId
    })

    await this.publishDisplay(display)

    const servoId =
      context.scan.readerLocation === 'entry'
        ? this.env.entryServoDeviceId
        : this.env.exitServoDeviceId

    await this.publish(`parking/commands/servo/${servoId}`, {
      action: 'open'
    })

    return true
  }

  async publishDenied(context: GateCommandContext): Promise<boolean> {
    if (!this.client) {
      return false
    }

    const display = displayMessageForDenied(context.reason)
    await this.publishDisplay(display)
    return true
  }

  private async publishDisplay(display: {
    line1: string
    line2: string
  }): Promise<void> {
    await this.publish(
      `parking/commands/display/${this.env.entryDisplayDeviceId}`,
      {
        line1: display.line1,
        line2: display.line2,
        backlight: true
      }
    )
  }

  private async publish(
    topic: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.client!.send(
      new PublishCommand({
        topic,
        payload: Buffer.from(JSON.stringify(payload)),
        qos: 1
      })
    )
  }
}
