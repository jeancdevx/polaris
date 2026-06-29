import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider'
import { ConfigService } from '@nestjs/config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { CognitoService } from './cognito.service.js'

const integrationEnabled = process.env.COGNITO_INTEGRATION === '1'

const requiredEnv = [
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'AWS_REGION'
] as const

const missingEnv = requiredEnv.filter(name => !process.env[name])

const describeIntegration =
  integrationEnabled && missingEnv.length === 0 ? describe : describe.skip

const provisionAdminUser = async (
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  email: string,
  password: string
): Promise<void> => {
  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS'
    })
  )

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true
    })
  )

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: 'user'
    })
  )
}

describeIntegration('auth cognito integration', () => {
  const region = process.env.AWS_REGION ?? 'us-east-2'
  const userPoolId = process.env.COGNITO_USER_POOL_ID ?? ''
  const clientId = process.env.COGNITO_CLIENT_ID ?? ''
  const client = new CognitoIdentityProviderClient({ region })
  const configService = new ConfigService({
    cognito: {
      userPoolId,
      clientId,
      region
    }
  })

  const cognitoService = new CognitoService(configService)

  const testEmail = `polaris-auth-${Date.now()}@example.com`
  const testPassword = 'PolarisTest1!'

  beforeAll(async () => {
    await provisionAdminUser(client, userPoolId, testEmail, testPassword)
  })

  afterAll(async () => {
    await client.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: testEmail
      })
    )
  })

  it('runs signin, refresh and logout for an admin-provisioned user', async () => {
    const signin = await cognitoService.signIn(testEmail, testPassword)

    expect(signin.accessToken).toBeTruthy()
    expect(signin.refreshToken).toBeTruthy()

    const refreshed = await cognitoService.refresh(signin.refreshToken)

    expect(refreshed.accessToken).toBeTruthy()
    expect(refreshed.refreshToken).toBe(signin.refreshToken)

    await expect(
      cognitoService.signOut(refreshed.accessToken)
    ).resolves.toBeUndefined()
  })
})
