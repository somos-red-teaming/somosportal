import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  turbopack: {
    root: __dirname,
  },
  // Disable static optimization for pages that use authentication
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

export default nextConfig
