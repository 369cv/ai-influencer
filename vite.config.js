import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Installable, offline-capable app. Only the app shell is precached; the
// ~500 MB of seed media in public/ is cached on first view instead.
const pwa = VitePWA({
  registerType: 'autoUpdate',
  // Registered from src/main.jsx via virtual:pwa-register, which reloads the
  // page when a new version takes over (the injected script did not, so a new
  // deploy only showed after a second reload).
  injectRegister: false,
  includeAssets: ['icon.svg', 'apple-touch-icon.png', 'hf-icon.png'],
  manifest: {
    name: 'Muse Studio',
    short_name: 'Muse Studio',
    description: 'Design, manage and generate AI influencers.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F9FC',
    theme_color: '#F8F9FC',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['index.html', 'assets/**/*.{js,css}', 'assets/figtree-latin-*.woff2', '*.{svg,png,ico,json}'],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        // API traffic (Higgsfield proxy, Claude, search) is never cached
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: ({ url }) => url.pathname === '/seeds.json',
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'seed-data' },
      },
      {
        // Seed images and generated images (same-origin + Higgsfield CDN)
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: ({ request }) => request.destination === 'video',
        handler: 'CacheFirst',
        options: {
          cacheName: 'videos',
          rangeRequests: true,
          expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true },
          cacheableResponse: { statuses: [200] },
        },
      },
    ],
  },
})

// Local dev search proxy — mirrors api/search.js for Vercel production
const searchPlugin = {
  name: 'search-proxy',
  configureServer(server) {
    server.middlewares.use('/api/search', async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

      const q = new URLSearchParams(req.url.split('?')[1] || '').get('q')
      if (!q) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing q' })); return }

      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`
        const r = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        })
        const xml = await r.text()
        const items = []
        for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
          const block = match[1]
          const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || '').trim()
          const desc = (block.match(/<description><!\[CDATA\[(.*?)\]\]>/)?.[1] || block.match(/<description>(.*?)<\/description>/)?.[1] || '')
            .replace(/<[^>]+>/g, '').trim().slice(0, 300)
          const date = (block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '').trim()
          if (title) items.push({ title, description: desc, date })
          if (items.length >= 8) break
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ items }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message, items: [] }))
      }
    })
  },
}

// Local dev image proxy — mirrors api/img-proxy.js for Vercel production
const imgProxyPlugin = {
  name: 'img-proxy',
  configureServer(server) {
    server.middlewares.use('/api/img-proxy', async (req, res) => {
      const qs = new URLSearchParams(req.url.split('?')[1] || '')
      const url = qs.get('url')
      const name = qs.get('name') || 'image.jpg'
      if (!url) { res.writeHead(400); res.end('Missing url'); return }
      if (qs.get('mode') === 'import') {
        const { isSafeImportUrl } = await import('./api/img-proxy.js')
        if (!isSafeImportUrl(url)) { res.writeHead(403); res.end('URL not allowed'); return }
      }
      try {
        const r = await fetch(decodeURIComponent(url))
        const ct = r.headers.get('content-type') || 'image/jpeg'
        const buf = await r.arrayBuffer()
        res.writeHead(r.status, {
          'Content-Type': ct,
          'Content-Disposition': `attachment; filename="${decodeURIComponent(name)}"`,
          'Access-Control-Allow-Origin': '*',
        })
        res.end(Buffer.from(buf))
      } catch (e) {
        res.writeHead(500); res.end('Proxy error: ' + e.message)
      }
    })
  },
}

// Local dev Claude proxy — mirrors api/claude.js for Vercel production
const claudePlugin = {
  name: 'claude-proxy',
  configureServer(server) {
    server.middlewares.use('/api/claude', async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-beta')
      if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
      if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return }
      const apiKey = req.headers['x-api-key']
      if (!apiKey) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: { message: 'Missing x-api-key' } })); return }
      const chunks = []
      req.on('data', c => chunks.push(c))
      await new Promise(r => req.on('end', r))
      const body = Buffer.concat(chunks).toString()
      try {
        const upstreamHeaders = {
          'x-api-key': apiKey,
          'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
          'content-type': 'application/json',
        }
        if (req.headers['anthropic-beta']) upstreamHeaders['anthropic-beta'] = req.headers['anthropic-beta']
        const upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: upstreamHeaders, body })
        const data = await upstream.json()
        res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(data))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: { message: e.message } }))
      }
    })
  },
}

// Local dev ElevenLabs proxy — mirrors api/elevenlabs.js for Vercel production
const elevenPlugin = {
  name: 'elevenlabs-proxy',
  configureServer(server) {
    server.middlewares.use('/api/elevenlabs', async (req, res) => {
      const url = new URL(req.url, 'http://local')
      const chunks = []
      req.on('data', c => chunks.push(c))
      await new Promise(r => req.on('end', r))
      let body = {}
      try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}') } catch {}
      const { handleElevenLabs } = await import('./api/elevenlabs.js')
      try {
        const out = await handleElevenLabs({ method: req.method, op: url.searchParams.get('op'), voice: url.searchParams.get('voice'), key: req.headers['x-api-key'], body })
        if (out.audio) { res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' }); res.end(out.audio); return }
        res.writeHead(out.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(out.json))
      } catch {
        res.writeHead(502, { 'Content-Type': 'application/json' }); res.end('{"error":"Could not reach ElevenLabs."}')
      }
    })
  },
}

// Local dev posting proxy — mirrors api/publish.js for Vercel production
const publishPlugin = {
  name: 'publish-proxy',
  configureServer(server) {
    server.middlewares.use('/api/publish', async (req, res) => {
      if (req.method !== 'POST') { res.writeHead(405, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"POST only"}'); return }
      const chunks = []
      req.on('data', c => chunks.push(c))
      await new Promise(r => req.on('end', r))
      let body = {}
      try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}') } catch {}
      const { handlePublish } = await import('./api/publish.js')
      const { status, json } = await handlePublish(body)
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify(json))
    })
  },
}

export default defineConfig({
  plugins: [react(), pwa, searchPlugin, imgProxyPlugin, claudePlugin, publishPlugin, elevenPlugin],
  server: {
    proxy: {
      '/api/hf': {
        target: 'https://mcp.higgsfield.ai',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/hf/, ''),
      },
    },
  },
})
