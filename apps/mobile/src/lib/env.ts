import Constants from 'expo-constants'
import { Platform } from 'react-native'

export type MobileEnv = Readonly<{
  apiUrl: string
  reservationApiUrl: string
  appsyncGraphqlEndpoint: string
  appsyncRealtimeEndpoint: string
  awsRegion: string
}>

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const readDevServerHost = (): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri

  if (!hostUri) {
    return null
  }

  const host = hostUri.split(':')[0]?.trim()
  return host && host.length > 0 ? host : null
}

/** En dispositivo/emulador, localhost apunta al teléfono — reescribe al host del bundler. */
export const resolveLocalApiHost = (url: string): string => {
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    return url
  }

  const devHost = readDevServerHost()
  if (devHost) {
    return url.replace('localhost', devHost).replace('127.0.0.1', devHost)
  }

  if (Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2')
  }

  return url
}

export const readMobileEnv = (): MobileEnv => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL
  const reservationApiUrl =
    process.env.EXPO_PUBLIC_RESERVATION_API_URL ?? apiUrl
  const appsyncGraphqlEndpoint =
    process.env.EXPO_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT
  const appsyncRealtimeEndpoint =
    process.env.EXPO_PUBLIC_APPSYNC_REALTIME_ENDPOINT
  const awsRegion = process.env.EXPO_PUBLIC_AWS_REGION ?? 'us-east-2'

  if (!apiUrl) {
    throw new Error(
      'Falta EXPO_PUBLIC_API_URL. Ejecuta pnpm mobile:env:dev o mobile:env:local.'
    )
  }

  return {
    apiUrl: resolveLocalApiHost(trimTrailingSlash(apiUrl)),
    reservationApiUrl: resolveLocalApiHost(
      trimTrailingSlash(reservationApiUrl ?? apiUrl)
    ),
    appsyncGraphqlEndpoint: appsyncGraphqlEndpoint ?? '',
    appsyncRealtimeEndpoint: appsyncRealtimeEndpoint ?? '',
    awsRegion
  }
}
