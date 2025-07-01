import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: ['@headlessui/react', 'lucide-react', 'react-icons'],
    // Turbo configuration for path aliases
    turbo: {
      resolveAlias: {
        '@': path.join(__dirname, 'src'),
      },
    },
  },

  // Webpack configuration for path aliases (fallback for non-turbo builds)
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    }
    return config
  },

  // Environment variable configuration
  env: {
    // Database URL for build process
    DATABASE_URL:
      process.env.DATABASE_URL || 'postgresql://fallback:password@localhost:5432/fallback_db',
  },

  // Logging configuration for development
  logging: {
    fetches: {
      fullUrl: true, // Show full URLs in development console
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'yunxidsqumhfushjcgyg.supabase.co',
        pathname: '/**',
      },
    ],
  },

  // Development configuration
  allowedDevOrigins: ['localhost:3000'],

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: [
              'X-CSRF-Token',
              'X-Requested-With',
              'Accept',
              'Accept-Version',
              'Content-Length',
              'Content-MD5',
              'Content-Type',
              'Date',
              'X-Api-Version',
              'Authorization',
            ].join(', '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
