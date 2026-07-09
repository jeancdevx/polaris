import { runDevReset } from '@polaris/database'

runDevReset()
  .then(result => {
    process.stdout.write(
      `Dev reset completed: seeded ${result.seed.users} users, ${result.seed.parkingSpots} spots; Redis synced (${result.redisKeysDeleted} old keys removed)\n`
    )
  })
  .catch(error => {
    process.stderr.write(
      `Dev reset failed: ${error instanceof Error ? error.message : String(error)}\n`
    )
    process.exit(1)
  })
