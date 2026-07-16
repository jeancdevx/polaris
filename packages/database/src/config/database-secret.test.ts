import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  hydrateDatabaseEnv,
  resetDatabaseSecretCacheForTests
} from './database-secret.js'

afterEach(() => {
  resetDatabaseSecretCacheForTests()
})

describe('hydrateDatabaseEnv', () => {
  it('hydrates missing DB_* values from the RDS secret', async () => {
    const env: NodeJS.ProcessEnv = {
      DB_SECRET_ARN: 'arn:aws:secretsmanager:region:account:secret:rds'
    }
    const loadSecretString = vi.fn().mockResolvedValue(
      JSON.stringify({
        host: 'secret.cluster',
        port: 5432,
        dbname: 'parking_db',
        username: 'parking_admin',
        password: 'secret-password'
      })
    )

    await hydrateDatabaseEnv({ env, loadSecretString })

    expect(env).toMatchObject({
      DB_HOST: 'secret.cluster',
      DB_PORT: '5432',
      DB_NAME: 'parking_db',
      DB_USERNAME: 'parking_admin',
      DB_PASSWORD: 'secret-password'
    })
  })

  it('preserves explicit environment values over secret values', async () => {
    const env: NodeJS.ProcessEnv = {
      DB_SECRET_ARN: 'arn:aws:secretsmanager:region:account:secret:rds',
      DB_HOST: 'terraform.cluster',
      DB_PORT: '6432',
      DB_NAME: 'configured_db',
      DB_USERNAME: 'explicit-user',
      DB_PASSWORD: 'explicit-password'
    }
    const loadSecretString = vi.fn().mockResolvedValue(
      JSON.stringify({
        host: 'secret.cluster',
        port: 5432,
        dbname: 'secret_db',
        username: 'secret-user',
        password: 'secret-password'
      })
    )

    await hydrateDatabaseEnv({ env, loadSecretString })

    expect(env).toMatchObject({
      DB_HOST: 'terraform.cluster',
      DB_PORT: '6432',
      DB_NAME: 'configured_db',
      DB_USERNAME: 'explicit-user',
      DB_PASSWORD: 'explicit-password'
    })
    expect(loadSecretString).not.toHaveBeenCalled()
  })

  it('caches the secret fetch across cold-start consumers', async () => {
    const secretArn = 'arn:aws:secretsmanager:region:account:secret:rds'
    const firstEnv: NodeJS.ProcessEnv = { DB_SECRET_ARN: secretArn }
    const secondEnv: NodeJS.ProcessEnv = { DB_SECRET_ARN: secretArn }
    const loadSecretString = vi.fn().mockResolvedValue(
      JSON.stringify({
        username: 'parking_admin',
        password: 'secret-password'
      })
    )

    await Promise.all([
      hydrateDatabaseEnv({ env: firstEnv, loadSecretString }),
      hydrateDatabaseEnv({ env: secondEnv, loadSecretString })
    ])

    expect(loadSecretString).toHaveBeenCalledOnce()
    expect(secondEnv.DB_USERNAME).toBe('parking_admin')
    expect(secondEnv.DB_PASSWORD).toBe('secret-password')
  })

  it('retries after a failed secret fetch', async () => {
    const env: NodeJS.ProcessEnv = {
      DB_SECRET_ARN: 'arn:aws:secretsmanager:region:account:secret:rds'
    }
    const loadSecretString = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(
        JSON.stringify({
          username: 'parking_admin',
          password: 'secret-password'
        })
      )

    await expect(hydrateDatabaseEnv({ env, loadSecretString })).rejects.toThrow(
      'temporary failure'
    )
    await hydrateDatabaseEnv({ env, loadSecretString })

    expect(loadSecretString).toHaveBeenCalledTimes(2)
  })
})
