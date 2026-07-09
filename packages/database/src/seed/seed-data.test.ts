import { describe, expect, it } from 'vitest'

import { buildSeedData } from './seed-data.js'

describe('buildSeedData', () => {
  it('creates 10 free parking spots', () => {
    const { parkingSpots } = buildSeedData()

    expect(parkingSpots).toHaveLength(10)
    expect(parkingSpots.every(spot => spot.status === 'free')).toBe(true)
    expect(parkingSpots.map(spot => spot.spotId)).toEqual([
      'spot-01',
      'spot-02',
      'spot-03',
      'spot-04',
      'spot-05',
      'spot-06',
      'spot-07',
      'spot-08',
      'spot-09',
      'spot-10'
    ])
  })

  it('creates admin, registered test user, and visitor', () => {
    const { users } = buildSeedData()

    expect(users).toHaveLength(3)

    const admin = users.find(user => user.role === 'admin')
    const testUser = users.find(user => user.userId === 'usr-12345')
    const visitor = users.find(user => user.userId === 'usr-visitor01')

    expect(admin).toMatchObject({
      userId: 'usr-admin01',
      email: 'admin@polaris.local',
      role: 'admin',
      userType: 'registered'
    })
    expect(testUser).toMatchObject({
      userId: 'usr-12345',
      email: 'juan@example.com',
      vehiclePlate: 'ABC-1234',
      rfidUid: 'A3:BF:22:01',
      role: 'user',
      userType: 'registered'
    })
    expect(visitor).toMatchObject({
      userId: 'usr-visitor01',
      email: 'visitor@polaris.local',
      vehiclePlate: 'VIS-0001',
      rfidUid: 'B1:CE:33:02',
      role: 'user',
      userType: 'visitor'
    })
  })

  it('creates RFID tags for seeded users', () => {
    const { rfidTags } = buildSeedData()

    expect(rfidTags).toHaveLength(3)
    expect(rfidTags.every(tag => tag.isActive)).toBe(true)
    expect(rfidTags.map(tag => tag.rfidUid)).toEqual([
      'A1:B2:C3:D4',
      'A3:BF:22:01',
      'B1:CE:33:02'
    ])
    expect(rfidTags.find(tag => tag.rfidUid === 'B1:CE:33:02')?.userType).toBe(
      'visitor'
    )
  })
})
