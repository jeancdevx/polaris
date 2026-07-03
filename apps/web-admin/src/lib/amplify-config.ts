import { Amplify, type ResourcesConfig } from 'aws-amplify'

let configured = false

const readAmplifyConfig = (): ResourcesConfig | null => {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
  const endpoint = process.env.NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT
  const region = process.env.NEXT_PUBLIC_AWS_REGION

  if (!userPoolId || !userPoolClientId || !endpoint || !region) {
    return null
  }

  return {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId
      }
    },
    API: {
      GraphQL: {
        endpoint,
        region,
        defaultAuthMode: 'userPool'
      }
    }
  }
}

export const configureAmplify = (): boolean => {
  if (configured) {
    return true
  }

  const config = readAmplifyConfig()

  if (!config) {
    return false
  }

  Amplify.configure(config, { ssr: true })
  configured = true
  return true
}

export const requireAmplifyConfig = (): void => {
  if (!configureAmplify()) {
    throw new Error(
      'Faltan variables NEXT_PUBLIC_COGNITO_* o NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT.'
    )
  }
}
