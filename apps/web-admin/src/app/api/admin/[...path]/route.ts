import { type NextRequest } from 'next/server'

const readAdminApiBaseUrl = (): string => {
  const base = process.env.ADMIN_API_URL ?? 'http://127.0.0.1:3004'

  return base.replace(/\/$/, '')
}

const proxyAdminRequest = async (
  request: NextRequest,
  pathSegments: string[]
): Promise<Response> => {
  const targetPath = `/admin/${pathSegments.join('/')}`
  const targetUrl = `${readAdminApiBaseUrl()}${targetPath}${request.nextUrl.search}`

  const headers = new Headers()
  const authorization = request.headers.get('authorization')

  if (authorization) {
    headers.set('authorization', authorization)
  }

  const contentType = request.headers.get('content-type')

  if (contentType) {
    headers.set('content-type', contentType)
  }

  const body = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.text()

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: body || undefined
  })

  const responseBody = await upstream.text()

  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json'
    }
  })
}

type RouteContext = Readonly<{
  params: Promise<{ path: string[] }>
}>

export const GET = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => proxyAdminRequest(request, (await context.params).path)

export const POST = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => proxyAdminRequest(request, (await context.params).path)

export const PUT = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => proxyAdminRequest(request, (await context.params).path)

export const DELETE = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => proxyAdminRequest(request, (await context.params).path)
