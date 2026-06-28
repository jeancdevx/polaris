import { loadLocalEnv } from '@polaris/shared-utils'

import { runKafkaSmokeTest } from '../smoke/run-kafka-smoke-test.js'

loadLocalEnv(import.meta.url)

runKafkaSmokeTest()
  .then(result => {
    console.log(
      `Kafka smoke test passed (${result.topic}, reservation ${result.reservationId}).`
    )
  })
  .catch(error => {
    console.error('Kafka smoke test failed:', error)
    process.exit(1)
  })
