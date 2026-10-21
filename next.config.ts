import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Permite vídeos do R2 e de URLs externas no player
  async headers() {
    return [
      {
        // Cache-Control para o Service Worker: nunca cachear o sw.js em si
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
