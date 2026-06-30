import { registerAs } from '@nestjs/config'

export type UsersConfig = {
  awsRegion: string
  cognitoUserPoolId: string
  rfidValidationsTableName?: string
}

export const USERS_CONFIG_KEY = 'users'

export const usersConfig = registerAs(
  USERS_CONFIG_KEY,
  (): UsersConfig => ({
    awsRegion:
      process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
    rfidValidationsTableName: process.env.RFID_VALIDATIONS_TABLE_NAME
  })
)
