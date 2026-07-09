import {
  IoTDataPlaneClient,
  PublishCommand
} from '@aws-sdk/client-iot-data-plane'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  EVENT_PROCESSOR_CONFIG_KEY,
  type EventProcessorConfig
} from '../event-processor.config.js'

export type LedSpotMode = 'free' | 'occupied' | 'blink_green' | 'off'

@Injectable()
export class IotLedCommandPublisher {
  private readonly logger = new Logger(IotLedCommandPublisher.name)
  private client: IoTDataPlaneClient | undefined

  constructor(private readonly configService: ConfigService) {}

  async publishSpotMode(
    parkingSpotId: string,
    mode: LedSpotMode
  ): Promise<boolean> {
    const config = this.configService.getOrThrow<EventProcessorConfig>(
      EVENT_PROCESSOR_CONFIG_KEY
    )

    if (!config.ledCommandsEnabled || !config.iotDataEndpoint) {
      return false
    }

    const client = this.getClient(config)

    await client.send(
      new PublishCommand({
        topic: `parking/commands/led/${parkingSpotId}`,
        payload: Buffer.from(
          JSON.stringify({
            spotId: parkingSpotId,
            mode
          })
        ),
        qos: 1
      })
    )

    this.logger.debug(`LED command ${parkingSpotId} -> ${mode}`)
    return true
  }

  private getClient(config: EventProcessorConfig): IoTDataPlaneClient {
    if (!this.client) {
      this.client = new IoTDataPlaneClient({
        region: config.eventBridgeRegion,
        endpoint: config.iotDataEndpoint
      })
    }

    return this.client
  }
}
