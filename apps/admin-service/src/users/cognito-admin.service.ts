import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { USERS_CONFIG_KEY, type UsersConfig } from './users.config.js'

export type CognitoProvisionInput = Readonly<{
  email: string
  userId: string
  role: 'user' | 'admin'
  password: string
}>

@Injectable()
export class CognitoAdminService {
  private readonly config: UsersConfig
  private readonly client: CognitoIdentityProviderClient

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<UsersConfig>(USERS_CONFIG_KEY)
    this.client = new CognitoIdentityProviderClient({
      region: this.config.awsRegion
    })
  }

  private assertConfigured(): void {
    if (!this.config.cognitoUserPoolId) {
      throw new InternalServerErrorException(
        'COGNITO_USER_POOL_ID must be configured'
      )
    }
  }

  async provisionUser(input: CognitoProvisionInput): Promise<void> {
    this.assertConfigured()

    await this.client.send(
      new AdminCreateUserCommand({
        UserPoolId: this.config.cognitoUserPoolId,
        Username: input.email,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'preferred_username', Value: input.userId }
        ],
        MessageAction: 'SUPPRESS'
      })
    )

    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.config.cognitoUserPoolId,
        Username: input.email,
        Password: input.password,
        Permanent: true
      })
    )

    await this.client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: this.config.cognitoUserPoolId,
        Username: input.email,
        GroupName: input.role
      })
    )
  }

  async disableUser(email: string): Promise<void> {
    this.assertConfigured()

    await this.client.send(
      new AdminDisableUserCommand({
        UserPoolId: this.config.cognitoUserPoolId,
        Username: email
      })
    )
  }

  async deleteUser(email: string): Promise<void> {
    this.assertConfigured()

    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.config.cognitoUserPoolId,
        Username: email
      })
    )
  }
}
