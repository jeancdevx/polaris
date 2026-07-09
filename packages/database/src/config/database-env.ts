export type DatabaseEnv = Readonly<{
  url: string
  logging: boolean
}>

const buildDatabaseUrlFromParts = (): string => {
  const host = process.env.DB_HOST?.trim()
  const port = process.env.DB_PORT?.trim() ?? '5432'
  const databaseName = process.env.DB_NAME?.trim()
  const username = process.env.DB_USERNAME?.trim()
  const password = process.env.DB_PASSWORD

  if (!host || !databaseName || !username || password == null) {
    throw new Error('DATABASE_URL is not set')
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${databaseName}?uselibpqcompat=true&sslmode=require`
}

const readDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (databaseUrl) {
    return databaseUrl
  }

  return buildDatabaseUrlFromParts()
}

export const readDatabaseEnv = (): DatabaseEnv => ({
  url: readDatabaseUrl(),
  logging: process.env.DB_LOGGING === 'true'
})
