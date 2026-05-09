import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com'
      },
      {
        protocol: 'https',
        hostname: 'cdn.sabinelab.com'
      },
      {
        protocol: 'https',
        hostname: 'cdn2.sabinelab.com'
      }
    ]
  },
  allowedDevOrigins: ['test.sabinelab.com']
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)