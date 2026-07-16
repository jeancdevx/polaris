import { beforeEach, describe, expect, it, vi } from 'vitest'

import { releaseUserUniqueConflicts } from './run-seed.js'
import { buildSeedData } from './seed-data.js'

describe('releaseUserUniqueConflicts', () => {
  const query = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    query.mockClear()
  })

  it('frees seed rfid_uid and email values before upsert', async () => {
    const { users } = buildSeedData()

    await releaseUserUniqueConflicts({ query } as never, users)

    expect(query).toHaveBeenCalledTimes(2)

    const [rfidSql, rfidParams] = query.mock.calls[0] as [string, [string[]]]
    expect(rfidSql).toContain('WHERE rfid_uid = ANY')
    expect(rfidParams[0]).toEqual(users.map(user => user.rfidUid))

    const [emailSql, emailParams] = query.mock.calls[1] as [string, [string[]]]
    expect(emailSql).toContain('WHERE email = ANY')
    expect(emailParams[0]).toEqual(users.map(user => user.email))
  })
})
