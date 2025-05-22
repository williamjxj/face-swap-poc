const path = require('path')

const nextConfig = {
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
  allowedDevOrigins: ['shop.ultimatech.hk', 'localhost:3000'],
}

module.exports = nextConfig
