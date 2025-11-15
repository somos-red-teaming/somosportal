import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const nextConfig = {
  // Remove static export - use regular Netlify deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
