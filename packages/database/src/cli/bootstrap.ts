import { runBootstrapIfNeeded } from '../bootstrap/run-bootstrap.js'

const formatResult = (
  result: Awaited<ReturnType<typeof runBootstrapIfNeeded>>
): string => {
  if (result.skipped) {
    return `Bootstrap skipped: ${result.reason ?? 'no changes needed'}`
  }

  const parts = ['Bootstrap completed']

  if (result.seed) {
    parts.push(
      `seeded ${result.seed.users} users, ${result.seed.parkingSpots} spots, ${result.seed.rfidTags} RFID tags`
    )
  }

  if (result.redisSynced) {
    parts.push('Redis parking state synced')
  }

  if (result.cognitoAdminCreated) {
    parts.push('Cognito admin user created')
  }

  return parts.join('; ')
}

runBootstrapIfNeeded()
  .then(result => {
    process.stdout.write(`${formatResult(result)}\n`)
  })
  .catch(error => {
    process.stderr.write(
      `Bootstrap failed: ${error instanceof Error ? error.message : String(error)}\n`
    )
    process.exit(1)
  })
