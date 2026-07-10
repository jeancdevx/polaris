import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { parseRfidScanEvent } from './iot-event.js'
import { readRfidValidatorEnv } from './read-env.js'
import {
  createValidateRfidScanDependencies,
  validateRfidScan,
  type RfidValidatorResponse
} from './validate-rfid-scan.js'

let dependencies = createValidateRfidScanDependencies(readRfidValidatorEnv())

export const resetRfidValidatorDependenciesForTests = (): void => {
  dependencies = createValidateRfidScanDependencies(readRfidValidatorEnv())
}

export const handler: Handler<unknown, RfidValidatorResponse> =
  instrumentLambdaHandler(
    { serviceName: 'rfid-validator' },
    async (event, _context, logger) => {
      const scan = parseRfidScanEvent(event)
      logger.info('RFID scan received', {
        rfidUid: scan.rfidUid,
        readerLocation: scan.readerLocation,
        deviceId: scan.deviceId
      })

      const result = await validateRfidScan(scan, dependencies)

      logger.info('RFID validation completed', {
        valid: result.valid,
        reason: result.reason,
        rfidUid: scan.rfidUid,
        readerLocation: scan.readerLocation,
        lookupSource: result.lookupSource,
        gateCommandsPublished: result.gateCommandsPublished,
        kafkaPublished: result.kafkaPublished
      })

      return result
    }
  )
