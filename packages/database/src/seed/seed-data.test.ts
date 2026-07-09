import { describe, expect, it } from 'vitest'

import {
  JUAN_PHYSICAL_RFID_UID,
  PHYSICAL_RFID_UIDS
} from './physical-rfid-uids.js'
import { buildSeedData } from './seed-data.js'

describe('buildSeedData', () => {
  it('creates 10 free parking spots', () => {
    const { parkingSpots } = buildSeedData()

    expect(parkingSpots).toHaveLength(10)
    expect(parkingSpots.every(spot => spot.status === 'free')).toBe(true)
  })

  it('creates admin, registered Juan, and visitor users for each spare card', () => {
    const { users } = buildSeedData()

    expect(users).toHaveLength(11)

    expect(users.find(user => user.role === 'admin')).toMatchObject({
      userId: 'usr-admin01',
      userType: 'registered',
      rfidUid: '00:AD:00:01'
    })

    expect(users.find(user => user.userId === 'usr-12345')).toMatchObject({
      email: 'juan@example.com',
      userType: 'registered',
      rfidUid: JUAN_PHYSICAL_RFID_UID
    })

    const visitors = users.filter(user => user.userType === 'visitor')
    expect(visitors).toHaveLength(9)
  })

  it('creates RFID tags for all 10 physical cards', () => {
    const { rfidTags } = buildSeedData()

    expect(rfidTags).toHaveLength(10)
    expect(rfidTags.every(tag => tag.isActive)).toBe(true)
    expect(rfidTags.map(tag => tag.rfidUid).sort()).toEqual(
      [...PHYSICAL_RFID_UIDS].sort()
    )

    expect(
      rfidTags.find(tag => tag.rfidUid === JUAN_PHYSICAL_RFID_UID)?.userType
    ).toBe('registered')

    expect(rfidTags.filter(tag => tag.userType === 'visitor')).toHaveLength(9)
  })
})
