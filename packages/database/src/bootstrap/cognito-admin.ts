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
    const user = await client.send(
      new AdminGetUserCommand({
        UserPoolId: config.userPoolId,
        Username: config.adminEmail
      })
    )

    return user.UserStatus === 'CONFIRMED'
  } catch (error) {
    if (error instanceof UserNotFoundException) {
      return false
    }

    throw error
  }
}

const setPermanentAdminPassword = async (
  config: CognitoAdminConfig,
  client: CognitoIdentityProviderClient
): Promise<void> => {
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: config.userPoolId,
      Username: config.adminEmail,
      Password: config.adminPassword,
      Permanent: true
    })
  )
}

export const provisionCognitoAdmin = async (
  config: CognitoAdminConfig,
  client = new CognitoIdentityProviderClient({ region: config.awsRegion })
): Promise<void> => {
  let created = false

  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: config.userPoolId,
        Username: config.adminEmail,
        TemporaryPassword: config.adminPassword,
        UserAttributes: [
          { Name: 'email', Value: config.adminEmail },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'preferred_username', Value: config.adminUserId }
        ],
        MessageAction: 'SUPPRESS'
      })
    )
    created = true
  } catch (error) {
    const name =
      error && typeof error === 'object' && 'name' in error
        ? String((error as { name: string }).name)
        : ''
    if (name !== 'UsernameExistsException') {
      throw error
    }
  }

  await setPermanentAdminPassword(config, client)

  try {
    await client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: config.userPoolId,
        Username: config.adminEmail,
        GroupName: 'admin'
      })
    )
  } catch (error) {
    if (created) {
      throw error
    }
    // User already in group after a prior partial provision.
  }
}
