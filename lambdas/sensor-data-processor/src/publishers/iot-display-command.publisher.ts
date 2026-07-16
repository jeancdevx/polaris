import {
  IoTDataPlaneClient,
  PublishCommand
} from '@aws-sdk/client-iot-data-plane'

import type { SensorDataProcessorEnv } from '../read-env.js'

export class IotDisplayCommandPublisher {
  private readonly client?: IoTDataPlaneClient

  constructor(private readonly env: SensorDataProcessorEnv) {
    if (env.ledCommandsEnabled && env.iotDataEndpoint) {
      this.client = new IoTDataPlaneClient({
        region:
          process.env.AWS_REGION ??
          process.env.AWS_DEFAULT_REGION ??
          'us-east-1',
        endpoint: env.iotDataEndpoint
      })
    }
  }

  async publishIdleFreeSpots(freeSpots: number): Promise<boolean> {
    if (!this.client) {
      return false
    }

    const displayId = process.env.ENTRY_DISPLAY_DEVICE_ID ?? 'entry-lcd'

    await this.client.send(
      new PublishCommand({
        topic: `parking/commands/display/${displayId}`,
        payload: Buffer.from(
          JSON.stringify({
            line1: 'Bienvenido',
            line2: `Libres: ${freeSpots}`,
            idle: true,
            freeSpots,
            backlight: true
          })
        ),
        qos: 1,
        retain: true
      })
    )

    return true
  }
}
