import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages (moved from experimental)
  serverExternalPackages: ['bcryptjs'],

  // Enable experimental features
  experimental: {
    // Temporairement désactivé pour troubleshooting
    // optimizePackageImports: ['@prisma/client', 'lucide-react'],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          ...(process.env.NODE_ENV === 'production' ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ] : []),
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/auth/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ]
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/maintenance',
      },
    ]
  },

  // Configuration webpack pour résoudre les problèmes de polyfills
  webpack: (config, { isServer }) => {
    // Polyfills pour le client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    return config
  },

  // Output configuration for standalone builds
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default withBundleAnalyzer(nextConfig)