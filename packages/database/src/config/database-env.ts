export type DatabaseEnv = Readonly<{
  url: string
  logging: boolean
}>

const hasDbParts = (): boolean => {
  const host = process.env.DB_HOST?.trim()
  const databaseName = process.env.DB_NAME?.trim()
  const username = process.env.DB_USERNAME?.trim()
  const password = process.env.DB_PASSWORD

  return Boolean(host && databaseName && username && password != null)
}

const buildDatabaseUrlFromParts = (): string => {
  const host = process.env.DB_HOST?.trim()
  const port = process.env.DB_PORT?.trim() ?? '5432'
  const databaseName = process.env.DB_NAME?.trim()
  const username = process.env.DB_USERNAME?.trim()
  const password = process.env.DB_PASSWORD

  if (!host || !databaseName || !username || password == null) {
    throw new Error(
      'Database connection is not configured (set DATABASE_URL or DB_HOST, DB_NAME, DB_USERNAME, and DB_PASSWORD)'
    )
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${databaseName}?uselibpqcompat=true&sslmode=require`
}

const readDatabaseUrl = (): string => {
  // Prefer DB_* parts when present. In ECS, Secrets Manager injections beat
  // RunTask environment overrides, so a stale DATABASE_URL secret must not win
  // over live DB_USERNAME/DB_PASSWORD from the RDS master secret.
  if (hasDbParts()) {
    return buildDatabaseUrlFromParts()
  }

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
