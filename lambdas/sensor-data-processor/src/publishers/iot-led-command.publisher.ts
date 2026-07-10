import {
  IoTDataPlaneClient,
  PublishCommand
} from '@aws-sdk/client-iot-data-plane'

import type { LedSpotMode } from '../led-mode.js'
import type { SensorDataProcessorEnv } from '../read-env.js'

export class IotLedCommandPublisher {
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

  async publishSpotMode(
    parkingSpotId: string,
    mode: LedSpotMode
  ): Promise<boolean> {
    if (!this.client) {
      return false
    }

    await this.client.send(
      new PublishCommand({
        topic: `parking/commands/led/${parkingSpotId}`,
        payload: Buffer.from(
          JSON.stringify({
            spotId: parkingSpotId,
            mode
          })
        ),
        qos: 1,
        retain: true
      })
    )

    return true
  }
}
