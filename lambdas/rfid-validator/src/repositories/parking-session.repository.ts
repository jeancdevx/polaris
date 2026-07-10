import type { ParkingSessionRow } from '@polaris/database'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

export type WalkInSession = Readonly<{
  sessionId: string
  rfidUid: string
  userId?: string
  vehiclePlate?: string
  entryAt: Date
}>

export class ParkingSessionRepository {
  async findOpenWalkInByRfidUid(
    rfidUid: string
  ): Promise<WalkInSession | null> {
    const dataSource = await getLambdaDataSource()
    const row = await dataSource
      .getRepository<ParkingSessionRow>('ParkingSession')
      .findOne({
        where: { rfidUid, status: 'open' },
        order: { entryAt: 'DESC' }
      })

    if (!row) {
      return null
    }

    return {
      sessionId: row.sessionId,
      rfidUid: row.rfidUid,
      userId: row.userId,
      vehiclePlate: row.vehiclePlate,
      entryAt: row.entryAt
    }
  }

  async createWalkInSession(input: {
    rfidUid: string
    userId?: string
    vehiclePlate?: string
    entryAt: Date
  }): Promise<WalkInSession> {
    const dataSource = await getLambdaDataSource()
    const repository =
      dataSource.getRepository<ParkingSessionRow>('ParkingSession')
    const insert = await repository.insert({
      rfidUid: input.rfidUid,
      userId: input.userId,
      vehiclePlate: input.vehiclePlate,
      status: 'open',
      entryAt: input.entryAt
    })

    const sessionId = insert.identifiers[0]?.sessionId

    if (typeof sessionId !== 'string') {
      throw new Error('Failed to create walk-in parking session')
    }

    return {
      sessionId,
      rfidUid: input.rfidUid,
      userId: input.userId,
      vehiclePlate: input.vehiclePlate,
      entryAt: input.entryAt
    }
  }

  async closeWalkInSession(sessionId: string, exitAt: Date): Promise<void> {
    const dataSource = await getLambdaDataSource()
    await dataSource.getRepository<ParkingSessionRow>('ParkingSession').update(
      { sessionId, status: 'open' },
      {
        status: 'closed',
        exitAt
      }
    )
  }
}
