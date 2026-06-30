import {
  IoTDataPlaneClient,
  PublishCommand
} from '@aws-sdk/client-iot-data-plane'

import type { RfidScanEvent } from '../iot-event.js'
import type { RfidValidatorEnv } from '../read-env.js'

export type GateCommandContext = Readonly<{
  scan: RfidScanEvent
  userName?: string
  parkingSpotId?: string
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

    if (context.scan.readerLocation === 'entry') {
      await this.publish(
        `parking/commands/display/${this.env.entryDisplayDeviceId}`,
        {
          line1: context.userName
            ? `Bienvenido ${context.userName.split(' ')[0]}`
            : 'Bienvenido',
          line2: context.parkingSpotId
            ? `Plaza ${context.parkingSpotId.replace('spot-', '')} reservada`
            : 'Acceso autorizado',
          backlight: true
        }
      )

      await this.publish(
        `parking/commands/servo/${this.env.entryServoDeviceId}`,
        { action: 'open', angle: 90 }
      )

      return true
    }

    await this.publish(`parking/commands/servo/${this.env.exitServoDeviceId}`, {
      action: 'open',
      angle: 90
    })

    return true
  }

  async publishDenied(context: GateCommandContext): Promise<boolean> {
    if (!this.client || context.scan.readerLocation !== 'entry') {
      return false
    }

    await this.publish(
      `parking/commands/display/${this.env.entryDisplayDeviceId}`,
      {
        line1: 'Acceso denegado',
        line2: 'Sin reserva activa',
        backlight: true
      }
    )

    return true
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
