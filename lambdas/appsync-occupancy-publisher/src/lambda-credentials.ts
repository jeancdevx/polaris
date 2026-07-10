import type { AwsCredentialIdentity, Provider } from '@smithy/types'

/** Lambda injects temporary credentials via env vars from the execution role. */
export const lambdaExecutionCredentials: Provider<
  AwsCredentialIdentity
> = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN

  if (!accessKeyId || !secretAccessKey) {
    return Promise.reject(
      new Error('Lambda execution credentials are missing from environment')
    )
  }

  return Promise.resolve({
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {})
  })
}
