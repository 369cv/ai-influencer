import { LOGOS } from '../utils/connectorLogos'

// Full-colour brand SVGs (lobe-icons / svgl), bundled as URLs.
const ASSETS = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/connectors/*.svg', { eager: true, query: '?url', import: 'default' }))
    .map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
)

// Light brand colours (Snapchat yellow, Gumroad pink…) get a dark glyph.
const isLight = hex => {
  const n = parseInt(hex, 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45
}

const Glyph = ({ logo, size, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ fill }} aria-hidden>
    <path d={logo.path} fillRule={logo.evenodd ? 'evenodd' : undefined} clipRule={logo.evenodd ? 'evenodd' : undefined} />
  </svg>
)

// A connector's app icon: brand mark in white on its brand colour (Simple Icons /
// lobe-icons path), a full-colour SVG on white (`asset`), the service's own image,
// or a lettered tile. Rounded like an app icon so every row lines up.
export default function ConnectorLogo({ c, slug, asset, size = 40 }) {
  const logo = LOGOS[slug || c?.logo]
  const assetUrl = ASSETS[asset || c?.asset]
  const radius = Math.round(size * 0.26)
  const tile = { width: size, height: size, borderRadius: radius, flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }
  const white = { ...tile, background: '#fff', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }

  if (c?.logos?.length) {
    const mini = Math.round(size * 0.38)
    return (
      <span style={{ ...white, display: 'flex', gap: Math.max(1, Math.round(size * 0.04)), justifyContent: 'center', alignItems: 'center' }} aria-hidden>
        {c.logos.map(sl => LOGOS[sl] && <Glyph key={sl} logo={LOGOS[sl]} size={mini} fill={`#${LOGOS[sl].hex}`} />)}
      </span>
    )
  }
  if (assetUrl) return <span style={white} aria-hidden><img src={assetUrl} alt="" width={Math.round(size * 0.62)} height={Math.round(size * 0.62)} style={{ objectFit: 'contain' }} /></span>
  if (logo) {
    const bg = logo.hex === '000000' ? '#111111' : `#${logo.hex}`
    return <span style={{ ...tile, background: bg }} aria-hidden><Glyph logo={logo} size={Math.round(size * 0.56)} fill={isLight(logo.hex) ? '#111111' : '#ffffff'} /></span>
  }
  if (c?.image) return <span style={{ ...(c.tile ? { ...tile, background: c.tile } : white) }} aria-hidden><img src={c.image} alt="" width={Math.round(size * 0.66)} height={Math.round(size * 0.66)} style={{ objectFit: 'contain' }} /></span>
  const bg = c?.color || 'var(--accent)'
  return (
    <span style={{ ...tile, background: bg, color: '#fff', fontWeight: 700, fontSize: Math.round(size * (String(c?.mono || '').length > 1 ? 0.36 : 0.44)), letterSpacing: '-0.02em' }} aria-hidden>
      {c?.mono || (c?.name || '?').slice(0, 2)}
    </span>
  )
}
