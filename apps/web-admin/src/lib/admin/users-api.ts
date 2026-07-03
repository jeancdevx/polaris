import { adminFetch } from '@/lib/admin/client'
import type {
  AdminUser,
  AdminUserListResponse,
  CreateAdminUserBody,
  CreateAdminUserResponse
} from '@/lib/admin/types'

export const listUsers = (
  includeInactive: boolean
): Promise<AdminUserListResponse> =>
  adminFetch<AdminUserListResponse>('/users', {
    searchParams: { includeInactive }
  })

export const createUser = (
  body: CreateAdminUserBody
): Promise<CreateAdminUserResponse> =>
  adminFetch<CreateAdminUserResponse>('/users', {
    method: 'POST',
    body
  })

export const deactivateUser = (userId: string): Promise<AdminUser> =>
  adminFetch<AdminUser>(`/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  })
