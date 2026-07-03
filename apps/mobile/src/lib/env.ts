export type MobileEnv = Readonly<{
  apiUrl: string
  appsyncGraphqlEndpoint: string
  appsyncRealtimeEndpoint: string
  awsRegion: string
}>

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

export const readMobileEnv = (): MobileEnv => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL
  const appsyncGraphqlEndpoint =
    process.env.EXPO_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT
  const appsyncRealtimeEndpoint =
    process.env.EXPO_PUBLIC_APPSYNC_REALTIME_ENDPOINT
  const awsRegion = process.env.EXPO_PUBLIC_AWS_REGION ?? 'us-east-2'

  if (!apiUrl || !appsyncGraphqlEndpoint || !appsyncRealtimeEndpoint) {
    throw new Error(
      'Faltan variables EXPO_PUBLIC_API_URL / EXPO_PUBLIC_APPSYNC_*. Ejecuta pnpm mobile:env:dev.'
    )
  }

  return {
    apiUrl: trimTrailingSlash(apiUrl),
    appsyncGraphqlEndpoint,
    appsyncRealtimeEndpoint,
    awsRegion
  }
}
