import { runBootstrapIfNeeded } from '@polaris/database'

runBootstrapIfNeeded()
  .then(result => {
    if (result.skipped) {
      process.stdout.write(
        `Bootstrap skipped: ${result.reason ?? 'no changes needed'}\n`
      )
      return
    }

    const parts = ['Bootstrap completed']

    if (result.seed) {
      parts.push(
        `seeded ${result.seed.users} users, ${result.seed.parkingSpots} spots`
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
