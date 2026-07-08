import { getAdminIdToken } from '@/lib/admin/auth-token'
import { AdminApiError, readApiErrorMessage } from '@/lib/admin/errors'

type AdminFetchOptions = Readonly<{
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  searchParams?: Record<string, string | number | boolean | undefined>
}>

const readAdminApiBaseUrl = (): string => {
  const base = process.env.NEXT_PUBLIC_ADMIN_API_URL

  if (!base) {
    throw new Error(
      'NEXT_PUBLIC_ADMIN_API_URL is required (admin API Gateway URL)'
    )
  }

  return base.replace(/\/$/, '')
}

const buildSearch = (
  searchParams: AdminFetchOptions['searchParams']
): string => {
  if (!searchParams) {
    return ''
  }

  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === '') {
      continue
    }

    query.set(key, String(value))
  }

  const serialized = query.toString()

  return serialized ? `?${serialized}` : ''
}

export const adminFetch = async <T>(
  path: string,
  options: AdminFetchOptions = {}
): Promise<T> => {
  const token = await getAdminIdToken()
  const search = buildSearch(options.searchParams)
  const response = await fetch(
    `${readAdminApiBaseUrl()}/admin${path}${search}`,
    {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    }
  )

  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      await readApiErrorMessage(response)
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
