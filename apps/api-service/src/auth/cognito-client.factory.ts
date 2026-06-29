import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

export type CognitoClientOptions = {
  region: string
}

export const createCognitoClient = (
  options: CognitoClientOptions
): CognitoIdentityProviderClient =>
  new CognitoIdentityProviderClient({
    region: options.region
  })
