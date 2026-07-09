import { describe, expect, it } from 'vitest'

import { releasedRfidUidForUser } from './release-rfid-uid.js'

describe('releasedRfidUidForUser', () => {
  it('returns a deterministic placeholder RFID per user', () => {
    expect(releasedRfidUidForUser('usr-card04')).toBe('00:RV:CE:CE')
    expect(releasedRfidUidForUser('usr-card04')).toBe(
      releasedRfidUidForUser('usr-card04')
    )
  })

  it('uses a different placeholder for each user', () => {
    expect(releasedRfidUidForUser('usr-card02')).not.toBe(
      releasedRfidUidForUser('usr-card04')
    )
  })
})
