/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@': path.join(__dirname, 'src')
      }
    }
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src')
    };
    return config;
  }
}

module.exports = nextConfig 