import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager'

type DatabaseSecret = Readonly<{
  host?: string
  port?: string
  databaseName?: string
  username: string
  password: string
}>

export type DatabaseSecretLoader = (secretArn: string) => Promise<string>

export type HydrateDatabaseEnvOptions = Readonly<{
  env?: NodeJS.ProcessEnv
  loadSecretString?: DatabaseSecretLoader
}>

const secretCache = new Map<string, Promise<DatabaseSecret>>()

const loadSecretString: DatabaseSecretLoader = async secretArn => {
  const client = new SecretsManagerClient({})
  const result = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  )

  if (!result.SecretString) {
    throw new Error('Database secret does not contain a SecretString')
  }

  return result.SecretString
}

const readString = (
  value: unknown,
  key: string,
  required = false
): string | undefined => {
  if (typeof value === 'string' && (value.length > 0 || key === 'password')) {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (required) {
    throw new Error(`Database secret is missing ${key}`)
  }

  return undefined
}

const parseDatabaseSecret = (secretString: string): DatabaseSecret => {
  let value: unknown

  try {
    value = JSON.parse(secretString)
  } catch {
    throw new Error('Database secret is not valid JSON')
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Database secret must be a JSON object')
  }

  const secret = value as Record<string, unknown>

  return {
    host: readString(secret.host, 'host'),
    port: readString(secret.port, 'port'),
    databaseName: readString(secret.dbname, 'dbname'),
    username: readString(secret.username, 'username', true) as string,
    password: readString(secret.password, 'password', true) as string
  }
}

const getDatabaseSecret = (
  secretArn: string,
  loader: DatabaseSecretLoader
): Promise<DatabaseSecret> => {
  const cached = secretCache.get(secretArn)

  if (cached) {
    return cached
  }

  const pending = loader(secretArn)
    .then(parseDatabaseSecret)
    .catch(error => {
      secretCache.delete(secretArn)
      throw error
    })

  secretCache.set(secretArn, pending)
  return pending
}

const setIfMissing = (
  env: NodeJS.ProcessEnv,
  key: string,
  value: string | undefined
): void => {
  if (env[key] == null && value != null) {
    env[key] = value
  }
}

const hasCompleteDatabaseEnv = (env: NodeJS.ProcessEnv): boolean =>
  Boolean(
    env.DB_HOST?.trim() &&
    env.DB_NAME?.trim() &&
    env.DB_USERNAME?.trim() &&
    env.DB_PASSWORD != null
  )

export const hydrateDatabaseEnv = async (
  options: HydrateDatabaseEnvOptions = {}
): Promise<void> => {
  const env = options.env ?? process.env

  if (hasCompleteDatabaseEnv(env)) {
    return
  }

  const secretArn = env.DB_SECRET_ARN?.trim()

  if (!secretArn) {
    return
  }

  const secret = await getDatabaseSecret(
    secretArn,
    options.loadSecretString ?? loadSecretString
  )

  setIfMissing(env, 'DB_HOST', secret.host)
  setIfMissing(env, 'DB_PORT', secret.port)
  setIfMissing(env, 'DB_NAME', secret.databaseName)
  setIfMissing(env, 'DB_USERNAME', secret.username)
  setIfMissing(env, 'DB_PASSWORD', secret.password)
}

export const resetDatabaseSecretCacheForTests = (): void => {
  secretCache.clear()
}
