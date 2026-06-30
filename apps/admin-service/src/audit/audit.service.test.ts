import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuditService } from './audit.service.js'

describe('AuditService', () => {
  const auditRepository = {
    findLogs: vi.fn()
  }

  const service = new AuditService(auditRepository as never)

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns paginated audit logs', async () => {
    vi.mocked(auditRepository.findLogs).mockResolvedValue({
      rows: [
        {
          logId: 'log-1',
          eventType: 'vehicle.entry',
          userId: 'usr-12345',
          userType: 'registered',
          vehiclePlate: 'ABC-123',
          parkingSpotId: 'spot-03',
          gate: 'entry',
          metadata: { source: 'test' },
          timestamp: new Date('2025-06-19T14:05:00.000Z')
        }
      ],
      total: 1
    })

    const result = await service.list({
      page: 1,
      limit: 20
    })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.items[0]?.eventType).toBe('vehicle.entry')
  })
})
