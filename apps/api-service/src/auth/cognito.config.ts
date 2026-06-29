import { registerAs } from '@nestjs/config'

export type CognitoConfig = {
  userPoolId: string
  clientId: string
  region: string
}

export const cognitoConfig = registerAs(
  'cognito',
  (): CognitoConfig => ({
    userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
    clientId: process.env.COGNITO_CLIENT_ID ?? '',
    region: process.env.AWS_REGION ?? 'us-east-2'
  })
)

export const COGNITO_CONFIG_KEY = 'cognito'
