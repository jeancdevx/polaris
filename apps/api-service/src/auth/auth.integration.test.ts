import {
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider'
import { ConfigService } from '@nestjs/config'
import { afterAll, describe, expect, it } from 'vitest'

import { CognitoService } from './cognito.service.js'

const integrationEnabled = process.env.COGNITO_INTEGRATION === '1'

const requiredEnv = [
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'AWS_REGION'
] as const

const missingEnv = requiredEnv.filter(name => !process.env[name])

if (integrationEnabled && missingEnv.length > 0) {
  console.warn(
    `[auth integration] skipped — missing env: ${missingEnv.join(', ')}. ` +
      'Set them in infra/local/.env.local and run pnpm test:integration:auth'
  )
}

const describeIntegration =
  integrationEnabled && missingEnv.length === 0 ? describe : describe.skip

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

  afterAll(async () => {
    await client.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: testEmail
      })
    )
  })

  it('runs signup, signin, refresh and logout against dev user pool', async () => {
    const signup = await cognitoService.signUp(testEmail, testPassword)

    expect(signup.confirmationRequired).toBe(true)

    await client.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: testEmail
      })
    )

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
