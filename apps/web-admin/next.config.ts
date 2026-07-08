import type { NextConfig } from 'next'

const isStaticExport = process.env.NEXT_OUTPUT === 'export'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@polaris/shared-types'],
  ...(isStaticExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true }
      }
    : {})
}

export default nextConfig
