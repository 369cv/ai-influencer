// Library — one flat, read-only list of every generated photo and video,
// merged from the two places the app already stores them:
//   1. localStorage 'photo_studio_history'   (Photo Studio shots)
//   2. influencer.generationHistory           (videos, sheets, close-ups, wardrobe)
// Nothing new is persisted here; handoffs reuse the keys the studios already read.

export const PHOTO_HISTORY_KEY = 'photo_studio_history'

const isVideoUrl = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

export function readPhotoHistory() {
  try { return JSON.parse(localStorage.getItem(PHOTO_HISTORY_KEY) || '[]') } catch { return [] }
}

export function collectLibrary(influencers = [], photoHistory = readPhotoHistory()) {
  const byId = Object.fromEntries(influencers.map(i => [i.id, i]))
  const seen = new Set()
  const items = []
  const push = it => {
    if (!it.url || seen.has(it.url)) return
    seen.add(it.url); items.push(it)
  }
  for (const h of photoHistory) {
    const inf = byId[h.influencerId]
    push({
      id: h.histId || h.url, url: h.url, kind: isVideoUrl(h.url) ? 'video' : 'photo',
      influencerId: h.influencerId, influencerName: inf?.name || h.influencerName || 'Unknown',
      label: 'Photo Studio', date: h.createdAt || 0, aspectRatio: h.aspectRatio || h.settings?.aspectRatio || '9:16',
      settings: h.settings || null, source: 'photo-studio',
    })
  }
  for (const inf of influencers) {
    for (const e of inf.generationHistory || []) {
      push({
        id: e.id || e.url, url: e.url, kind: e.type === 'video' || isVideoUrl(e.url) ? 'video' : 'photo',
        influencerId: inf.id, influencerName: inf.name || 'Untitled',
        label: e.label || (e.type === 'video' ? 'Video' : 'Image'), date: e.date || 0,
        aspectRatio: e.settings?.aspectRatio || '9:16', settings: e.settings || null, source: 'history',
      })
    }
  }
  return items.sort((a, b) => b.date - a.date)
}

// ── Handoffs into the existing studios ───────────────────────
// Photo Studio already restores settings from `ps_restore_pending_<id>` (History → Reuse settings).
// `ps_handoff_<id>` adds two extras Photo Studio reads once: a reference image and auto-opening the plan.
export function handoffToPhotoStudio(item, { useAsReference = false, openPlan = false } = {}) {
  try {
    if (item.settings && item.source === 'photo-studio') {
      localStorage.setItem(`ps_restore_pending_${item.influencerId}`, JSON.stringify(item.settings))
    }
    localStorage.setItem(`ps_handoff_${item.influencerId}`, JSON.stringify({ ref: useAsReference ? item.url : null, openPlan }))
  } catch {}
  return { pathname: '/influencers', state: { selectId: item.influencerId, studioTab: 'photo' } }
}

// Video Studio already reads its start frame from `hf_start_frame_<id>`.
export function handoffToVideoStudio(item) {
  try { localStorage.setItem(`hf_start_frame_${item.influencerId}`, item.url) } catch {}
  return { pathname: '/influencers', state: { selectId: item.influencerId, studioTab: 'content' } }
}
