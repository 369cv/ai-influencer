// Reads the scores Higgsfield's Virality Predictor returns. Pure (tested with node --test).
// Collects numeric scores (0–100 or 0–1) and a text summary from the analysis result.
export function readScores(data) {
  const scores = []
  const seen = new Set()
  const walk = (o, path = '') => {
    if (!o || typeof o !== 'object' || scores.length > 12) return
    for (const [k, v] of Object.entries(o)) {
      const key = k.toLowerCase()
      if (typeof v === 'number' && /score|virality|hook|retention|engagement|attention|potential/.test(key) && !seen.has(key)) {
        seen.add(key); scores.push({ key: k.replace(/_/g, ' '), value: v <= 1 && v >= 0 ? Math.round(v * 100) : Math.round(v) })
      } else if (v && typeof v === 'object') walk(v, `${path}.${k}`)
    }
  }
  walk(typeof data === 'object' ? data : {})
  const text = typeof data === 'string' ? data : (data?.summary || data?.analysis?.summary || data?.result?.summary || '')
  const link = (JSON.stringify(data ?? '').match(/https:\/\/higgsfield\.ai\/[^\s"'\\]+/) || [])[0] || ''
  return { scores, summary: String(text || '').slice(0, 600), url: link }
}
