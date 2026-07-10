import { describe, expect, it } from 'vitest'

import { lambdaExecutionCredentials } from './lambda-credentials.js'

describe('lambdaExecutionCredentials', () => {
  it('reads credentials from Lambda environment variables', async () => {
    process.env.AWS_ACCESS_KEY_ID = 'AKIATEST'
    process.env.AWS_SECRET_ACCESS_KEY = 'secret'
    process.env.AWS_SESSION_TOKEN = 'token'

    await expect(lambdaExecutionCredentials()).resolves.toEqual({
      accessKeyId: 'AKIATEST',
      secretAccessKey: 'secret',
      sessionToken: 'token'
    })
  })
})
