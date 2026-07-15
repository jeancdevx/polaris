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

@Injectable()
export class IotDisplayCommandPublisher {
  private readonly logger = new Logger(IotDisplayCommandPublisher.name)
  private client: IoTDataPlaneClient | undefined

  constructor(private readonly configService: ConfigService) {}

  async publishIdleFreeSpots(freeSpots: number): Promise<boolean> {
    const config = this.configService.getOrThrow<EventProcessorConfig>(
      EVENT_PROCESSOR_CONFIG_KEY
    )

    if (!config.ledCommandsEnabled || !config.iotDataEndpoint) {
      return false
    }

    const displayId = process.env.ENTRY_DISPLAY_DEVICE_ID ?? 'entry-lcd'
    const client = this.getClient(config)

    await client.send(
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

    this.logger.log(`LCD idle free spots -> ${freeSpots}`)
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
