import { runBootstrapIfNeeded } from '@polaris/database'

runBootstrapIfNeeded()
  .then(result => {
    const parts = result.skipped
      ? [`Bootstrap skipped: ${result.reason ?? 'no changes needed'}`]
      : ['Bootstrap completed']

    if (result.seed) {
      parts.push(
        `seed synced ${result.seed.users} users, ${result.seed.parkingSpots} spots, ${result.seed.rfidTags} RFID tags`
      )
    }

    if (result.redisSynced) {
      parts.push('Redis synced')
    }

    if (result.cognitoAdminCreated) {
      parts.push('Cognito admin created')
    }

    process.stdout.write(`${parts.join('; ')}\n`)
  })
  .catch(error => {
    process.stderr.write(
      `Bootstrap failed: ${error instanceof Error ? error.message : String(error)}\n`
    )
    process.exit(1)
  })
