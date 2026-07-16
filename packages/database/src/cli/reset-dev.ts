import { runDevReset } from '../bootstrap/run-dev-reset.js'

runDevReset()
  .then(result => {
    process.stdout.write(
      `Dev reset completed: seeded ${result.seed.users} users, ${result.seed.parkingSpots} spots, ${result.seed.rfidTags} RFID tags; flushed ${result.redisKeysDeleted} Redis keys; Redis synced from RDS; Cognito admin password ensured permanent\n`
    )
  })
  .catch(error => {
    process.stderr.write(
      `Dev reset failed: ${error instanceof Error ? error.message : String(error)}\n`
    )
    process.exit(1)
  })
