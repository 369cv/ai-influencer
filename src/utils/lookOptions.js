// Look-step option data shared by the Create wizard and its live preview.
// Swatch hexes are content (skin/hair/eye colours), not UI chrome, so they stay literal.

export const VIBE_OPTIONS = [
  { id: 'Minimalist',   label: 'Minimalist',   sub: 'Clean, simple, less is more',            icon: '🤍' },
  { id: 'Old Money',    label: 'Old Money',    sub: 'Understated wealth & heritage',           icon: '🏛' },
  { id: 'Clean Girl',   label: 'Clean Girl',   sub: 'Effortless, dewy, no-makeup look',        icon: '🫧', genders: ['female'] },
  { id: 'Editorial',    label: 'Editorial',    sub: 'High fashion, bold & structured',         icon: '🖤' },
  { id: 'Streetwear',   label: 'Streetwear',   sub: 'Urban, casual street style',              icon: '🧢' },
  { id: 'Bohemian',     label: 'Bohemian',     sub: 'Earthy, flowy, free-spirited',            icon: '🌿' },
  { id: 'Glam',         label: 'Glam',         sub: 'Dressy, dramatic & glamorous',            icon: '✨' },
  { id: 'Preppy',       label: 'Preppy',       sub: 'Classic, collegiate, polished',           icon: '🎓' },
  { id: 'Sporty',       label: 'Sporty',       sub: 'Athletic & activewear vibes',             icon: '⚡' },
  { id: 'Dark & Moody', label: 'Dark & Moody', sub: 'Alternative, edgy & dramatic',           icon: '🌙' },
  { id: 'Y2K',          label: 'Y2K',          sub: '2000s nostalgia & pop culture',           icon: '💿' },
  { id: 'Cottagecore',  label: 'Cottagecore',  sub: 'Romantic, vintage & nature',             icon: '🌸', genders: ['female'] },
  { id: 'Tech Bro',     label: 'Tech Bro',     sub: 'Smart-casual, Silicon Valley',            icon: '💻', genders: ['male'] },
  { id: 'Coastal',      label: 'Coastal',      sub: 'Linen, nautical, effortlessly sun-worn',  icon: '🌊' },
]

export const SKIN_TONES = [
  { id: 'fair',   label: 'Fair',   swatch: '#FDDBB4' },
  { id: 'light',  label: 'Light',  swatch: '#F0C080' },
  { id: 'medium', label: 'Medium', swatch: '#D4956A' },
  { id: 'tan',    label: 'Tan',    swatch: '#C07A47' },
  { id: 'brown',  label: 'Brown',  swatch: '#8B5E3C' },
  { id: 'deep',   label: 'Deep',   swatch: '#5C3A1E' },
  { id: 'ebony',  label: 'Ebony',  swatch: '#2D1A0E' },
]
export const HAIR_COLORS = [
  { id: 'blonde',   label: 'Blonde',    swatch: '#F5D17A' },
  { id: 'brunette', label: 'Brunette',  swatch: '#7B4F2E' },
  { id: 'black',    label: 'Black',     swatch: '#1A1A1A' },
  { id: 'auburn',   label: 'Auburn',    swatch: '#9B3A2A' },
  { id: 'red',      label: 'Red',       swatch: '#C0392B' },
  { id: 'silver',   label: 'Silver',    swatch: '#A8A8A8' },
  { id: 'dyed',     label: 'Dyed',      swatch: 'linear-gradient(135deg,#EC4899,#8B5CF6)' },
]
export const HAIR_LENGTHS_FEMALE = ['Short', 'Medium', 'Long', 'Extra long']
export const HAIR_LENGTHS_MALE   = ['Buzz cut', 'Short', 'Medium', 'Long']
export const HAIR_TEXTURES = ['Straight', 'Wavy', 'Curly', 'Coily']
export const EYE_COLORS = [
  { id: 'blue',       label: 'Blue',       swatch: '#4A90D9' },
  { id: 'green',      label: 'Green',      swatch: '#4A9B6F' },
  { id: 'brown',      label: 'Brown',      swatch: '#7B4F2E' },
  { id: 'hazel',      label: 'Hazel',      swatch: '#9B7A3A' },
  { id: 'dark',       label: 'Dark',       swatch: '#1A1008' },
  { id: 'light grey', label: 'Grey',       swatch: '#8A9BAA' },
]
export const BUILDS_FEMALE = ['Petite', 'Slim', 'Athletic', 'Average', 'Curvy', 'Tall', 'Plus']
export const BUILDS_MALE   = ['Slim', 'Athletic', 'Average', 'Muscular', 'Stocky', 'Tall']
export const ETHNICITIES = ['White', 'Black', 'Hispanic', 'East Asian', 'South Asian', 'Middle Eastern', 'Southeast Asian', 'Mixed']

