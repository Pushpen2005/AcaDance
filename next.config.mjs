/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['lcykmahapztccjkxrwsc.supabase.co'],
  },
  experimental: {
    // serverComponentsExternalPackages: ['@supabase/supabase-js'], // Removed as it's moved to serverExternalPackages
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig
