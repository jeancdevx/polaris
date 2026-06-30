import { BadRequestException } from '@nestjs/common'

export type PaginationQuery = Readonly<{
  page: number
  limit: number
}>

export type DateRangeQuery = Readonly<{
  from?: Date
  to?: Date
}>

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export const parsePageQuery = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_PAGE
  }

  const page = Number.parseInt(value, 10)

  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestException('page must be a positive integer')
  }

  return page
}

export const parseLimitQuery = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_LIMIT
  }

  const limit = Number.parseInt(value, 10)

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}`)
  }

  return limit
}

export const parsePaginationQuery = (
  pageValue: string | undefined,
  limitValue: string | undefined
): PaginationQuery => ({
  page: parsePageQuery(pageValue),
  limit: parseLimitQuery(limitValue)
})

export const parseIsoDateQuery = (
  value: string | undefined,
  field: string
): Date | undefined => {
  if (value === undefined) {
    return undefined
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO-8601 timestamp`)
  }

  return parsed
}

export const parseDateRangeQuery = (
  fromValue: string | undefined,
  toValue: string | undefined
): DateRangeQuery => {
  const from = parseIsoDateQuery(fromValue, 'from')
  const to = parseIsoDateQuery(toValue, 'to')

  if (from && to && from.getTime() > to.getTime()) {
    throw new BadRequestException('from must be before or equal to to')
  }

  return { from, to }
}

export const buildPaginatedResponse = <T>(input: {
  items: T[]
  total: number
  page: number
  limit: number
}): {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
} => ({
  items: input.items,
  page: input.page,
  limit: input.limit,
  total: input.total,
  totalPages: input.total === 0 ? 0 : Math.ceil(input.total / input.limit)
})
