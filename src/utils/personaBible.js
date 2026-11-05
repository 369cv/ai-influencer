// Persona bible: a portable export of one influencer (Markdown for people,
// JSON for tools). Images stored inside the app as data URLs are not copied
// into the files; they're marked as "stored in Muse Studio" instead, so the
// export stays small and readable.

const isEmbedded = v => typeof v === 'string' && v.startsWith('data:')
const imageRef = v => (!v ? null : isEmbedded(v) ? '(image stored in Muse Studio)' : v)
const clean = v => (typeof v === 'string' ? v.trim() : v)
const list = v => (Array.isArray(v) ? v.map(clean).filter(Boolean) : [])

export function personaToJSON(inf = {}) {
  return {
    format: 'muse-persona',
    version: 1,
    exportedAt: new Date().toISOString(),
    identity: {
      name: clean(inf.name) || '',
      gender: clean(inf.gender) || '',
      age: clean(inf.age) || '',
      type: clean(inf.type) || '',
      niche: clean(inf.niche === 'Other' ? inf.nicheCustom : inf.niche) || '',
      look: clean(inf.physicalDesc) || '',
      clothingStyle: clean(inf.clothingStyle) || '',
    },
    story: {
      backstory: clean(inf.backstory) || '',
      hobbies: clean(inf.hobbies) || '',
      introExtrovert: typeof inf.introExtrovert === 'number' ? inf.introExtrovert : null,
    },
    audience: {
      audience: clean(inf.audience) || '',
      voice: clean(inf.voice) || '',
      contentPillars: list(inf.contentPillars),
      dreamBrands: clean(inf.dreamBrands) || '',
    },
    brand: { palette: list(inf.palette) },
    voiceProfile: inf.voiceProfile?.voiceId ? {
      provider: inf.voiceProfile.provider || 'elevenlabs',
      voiceId: inf.voiceProfile.voiceId,
      voiceName: inf.voiceProfile.voiceName || '',
      model: inf.voiceProfile.model || '',
      settings: inf.voiceProfile.settings || {},
      seed: Number.isInteger(inf.voiceProfile.seed) ? inf.voiceProfile.seed : null,
    } : null,
    references: {
      main: imageRef(inf.mainImage),
      characterSheet: imageRef(inf.characterSheetImage),
      closeUps: [inf.closeUpImage1, inf.closeUpImage2].map(imageRef).filter(Boolean),
    },
    wardrobe: (inf.wardrobeSlots || []).map(s => clean(s?.name)).filter(Boolean),
    scripts: (inf.scripts || []).map(s => clean(s?.title)).filter(Boolean),
    brandDeals: (inf.brandDealImages || []).map(d => clean(d?.brand)).filter(Boolean),
  }
}

const section = (title, rows) => {
  const body = rows.filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length))
  if (!body.length) return ''
  return `## ${title}\n\n${body.map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}`
}

export function personaToMarkdown(inf = {}) {
  const p = personaToJSON(inf)
  const personality = p.story.introExtrovert == null ? '' : `${p.story.introExtrovert}% extrovert`
  const parts = [
    `# ${p.identity.name || 'Untitled'} — persona bible`,
    `Exported from Muse Studio on ${p.exportedAt.slice(0, 10)}.`,
    section('Identity', [['Gender', p.identity.gender], ['Age', p.identity.age], ['Type', p.identity.type], ['Niche', p.identity.niche], ['Look', p.identity.look], ['Clothing style', p.identity.clothingStyle]]),
    section('Story', [['Backstory', p.story.backstory], ['Hobbies', p.story.hobbies], ['Personality', personality]]),
    section('Audience and voice', [['Audience', p.audience.audience], ['Voice', p.audience.voice], ['Content pillars', p.audience.contentPillars], ['Dream brands', p.audience.dreamBrands]]),
    section('Voice', p.voiceProfile ? [['Voice', `${p.voiceProfile.voiceName || p.voiceProfile.voiceId} (${p.voiceProfile.provider}, ${p.voiceProfile.voiceId})`], ['Model', p.voiceProfile.model], ['Settings', Object.entries(p.voiceProfile.settings).map(([k, v]) => `${k} ${v}`)], ['Seed', p.voiceProfile.seed]] : []),
    section('Brand', [['Palette', p.brand.palette]]),
    section('References', [['Main image', p.references.main], ['Character sheet', p.references.characterSheet], ['Close-ups', p.references.closeUps]]),
    section('Wardrobe', [['Looks', p.wardrobe]]),
    section('Scripts', [['Saved', p.scripts]]),
    section('Brand deals', [['Brands', p.brandDeals]]),
  ]
  return parts.filter(Boolean).join('\n\n') + '\n'
}

function save(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportPersonaBible(inf) {
  const slug = (inf?.name || 'persona').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'persona'
  save(`${slug}-persona.md`, personaToMarkdown(inf), 'text/markdown')
  save(`${slug}-persona.json`, JSON.stringify(personaToJSON(inf), null, 2), 'application/json')
}
