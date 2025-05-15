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
  },
  allowedDevOrigins: [
    'https://shop.ultimatech.hk',
    'http://shop.ultimatech.hk',
    'https://nextjs.org',
    'http://nextjs.org',
    // Add any other domains that need to access your app
  ],
}

module.exports = nextConfig 