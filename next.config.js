const path = require('path')

const nextConfig = {
  // Path alias configuration for both Turbo and Webpack
  experimental: {
    turbo: {
      resolveAlias: {
        '@': path.join(__dirname, 'src'),
      },
    },
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    }
    return config
  },

  // Environment variables for build process
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL || 'postgresql://fallback:password@localhost:5432/fallback_db',
  },

  // Development configuration
  allowedDevOrigins: ['localhost:3000'],
  // CORS headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Overridden in middleware.js for specific origins
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
          },
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

module.exports = nextConfig
