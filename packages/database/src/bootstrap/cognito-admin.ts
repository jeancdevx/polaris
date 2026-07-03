import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException
} from '@aws-sdk/client-cognito-identity-provider'

export type CognitoAdminConfig = Readonly<{
  userPoolId: string
  awsRegion: string
  adminEmail: string
  adminUserId: string
  adminPassword: string
}>

export const readCognitoAdminConfig = (): CognitoAdminConfig => {
  const userPoolId = process.env.COGNITO_USER_POOL_ID
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD

  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID is not set')
  }

  if (!adminPassword) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD is not set')
  }

  return {
    userPoolId,
    awsRegion: process.env.AWS_REGION ?? 'us-east-2',
    adminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@polaris.local',
    adminUserId: process.env.BOOTSTRAP_ADMIN_USER_ID ?? 'usr-admin01',
    adminPassword
  }
}

export const cognitoAdminExists = async (
  config: CognitoAdminConfig,
  client = new CognitoIdentityProviderClient({ region: config.awsRegion })
): Promise<boolean> => {
  try {
    await client.send(
      new AdminGetUserCommand({
        UserPoolId: config.userPoolId,
        Username: config.adminEmail
      })
    )

    return true
  } catch (error) {
    if (error instanceof UserNotFoundException) {
      return false
    }

    throw error
  }
}

export const provisionCognitoAdmin = async (
  config: CognitoAdminConfig,
  client = new CognitoIdentityProviderClient({ region: config.awsRegion })
): Promise<void> => {
  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: config.userPoolId,
      Username: config.adminEmail,
      UserAttributes: [
        { Name: 'email', Value: config.adminEmail },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'preferred_username', Value: config.adminUserId }
      ],
      MessageAction: 'SUPPRESS'
    })
  )

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: config.userPoolId,
      Username: config.adminEmail,
      Password: config.adminPassword,
      Permanent: true
    })
  )

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: config.userPoolId,
      Username: config.adminEmail,
      GroupName: 'admin'
    })
  )
}
