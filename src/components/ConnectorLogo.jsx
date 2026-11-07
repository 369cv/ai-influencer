import { LOGOS } from '../utils/connectorLogos'

// A connector's logo on a white tile. Brand mark from Simple Icons when we
// have one, the service's own image (Higgsfield), or a lettered tile.
export default function ConnectorLogo({ c, slug, size = 40 }) {
  const logo = LOGOS[slug || c?.logo]
  const inner = Math.round(size * 0.56)
  const tile = { width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }
  if (c?.logos?.length) {
    const mini = Math.round(size * 0.4)
    return (
      <span style={{ ...tile, display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }} aria-hidden>
        {c.logos.map(sl => { const l = LOGOS[sl]; return l ? <svg key={sl} width={mini} height={mini} viewBox="0 0 24 24" style={{ fill: l.hex === '000000' ? 'var(--text-primary)' : `#${l.hex}` }}><path d={l.path} /></svg> : null })}
      </span>
    )
  }
  if (logo) {
    const fill = logo.hex === '000000' ? 'var(--text-primary)' : `#${logo.hex}`
    return (
      <span style={tile} aria-hidden>
        <svg width={inner} height={inner} viewBox="0 0 24 24" role="img" style={{ fill }}><path d={logo.path} /></svg>
      </span>
    )
  }
  if (c?.image) return <span style={tile} aria-hidden><img src={c.image} alt="" width={inner} height={inner} style={{ objectFit: 'contain' }} /></span>
  return (
    <span style={{ ...tile, background: c?.color || 'var(--tonal)', border: 'none', color: '#fff', fontWeight: 700, fontSize: Math.round(size * 0.36), letterSpacing: '-0.02em' }} aria-hidden>
      {c?.mono || (c?.name || '?').slice(0, 2)}
    </span>
  )
}
