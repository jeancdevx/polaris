import { afterEach, describe, expect, it } from 'vitest'

import { readDatabaseEnv } from './database-env.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('readDatabaseEnv', () => {
  it('uses DATABASE_URL when provided', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'

    expect(readDatabaseEnv().url).toBe('postgresql://user:pass@host:5432/db')
  })

  it('builds DATABASE_URL from DB_* variables', () => {
    delete process.env.DATABASE_URL
    process.env.DB_HOST = 'aurora.example'
    process.env.DB_PORT = '5432'
    process.env.DB_NAME = 'parking_db'
    process.env.DB_USERNAME = 'parking_admin'
    process.env.DB_PASSWORD = 'p@ss/w?rd'

    expect(readDatabaseEnv().url).toBe(
      'postgresql://parking_admin:p%40ss%2Fw%3Frd@aurora.example:5432/parking_db?uselibpqcompat=true&sslmode=require'
    )
  })

  it('throws when no database configuration is available', () => {
    delete process.env.DATABASE_URL
    delete process.env.DB_HOST
    delete process.env.DB_NAME
    delete process.env.DB_USERNAME
    delete process.env.DB_PASSWORD

    expect(() => readDatabaseEnv()).toThrow(
      'Database connection is not configured'
    )
  })
})
