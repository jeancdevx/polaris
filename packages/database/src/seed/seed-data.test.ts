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

  it('creates one admin and one test user', () => {
    const { users } = buildSeedData()

    expect(users).toHaveLength(2)

    const admin = users.find(user => user.role === 'admin')
    const testUser = users.find(user => user.userId === 'usr-12345')

    expect(admin).toMatchObject({
      userId: 'usr-admin01',
      email: 'admin@polaris.local',
      role: 'admin'
    })
    expect(testUser).toMatchObject({
      userId: 'usr-12345',
      email: 'juan@example.com',
      vehiclePlate: 'ABC-1234',
      rfidUid: 'A3:BF:22:01',
      role: 'user'
    })
  })

  it('creates RFID tags for seeded users', () => {
    const { rfidTags } = buildSeedData()

    expect(rfidTags).toHaveLength(2)
    expect(rfidTags.every(tag => tag.isActive)).toBe(true)
  })
})
