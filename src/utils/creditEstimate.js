// Credit estimates shown on the plan card before a generation starts.
//
// These are ESTIMATES, not prices. Higgsfield bills the real amount on the
// user's own account, and its prices change. Keep every number in this one
// table so updating them is a one-line change.
//
// Unit: Higgsfield credits per output image (or per second of video).

export const IMAGE_CREDITS = {
  soul_2:            { '1k': 1, '2k': 2, '4k': 2 },
  gpt_image_2:       { '1k': 4, '2k': 6, '4k': 8 },
  nano_banana_2:     { '1k': 3, '2k': 4, '4k': 6 },
  nano_banana_flash: { '1k': 1, '2k': 2, '4k': 3 },
}

export const VIDEO_CREDITS_PER_SECOND = {
  seedance_2_0: { '480p': 1, '720p': 2, '1080p': 3 },
}

export const MODEL_LABELS = {
  soul_2: 'Higgsfield Soul',
  gpt_image_2: 'GPT Image 2',
  nano_banana_2: 'Nano Banana Pro',
  nano_banana_flash: 'Nano Banana 2',
  seedance_2_0: 'Seedance 2.0',
}

// Resolution each model actually requests (see modelBaseParams in higgsfieldGenerate.js)
export const DEFAULT_RESOLUTION = {
  soul_2: '2k',
  gpt_image_2: '2k',
  nano_banana_2: '2k',
  nano_banana_flash: '2k',
}

export function estimateImageCredits(model, resolution, count = 1) {
  const row = IMAGE_CREDITS[model]
  if (!row) return null
  const per = row[String(resolution).toLowerCase()] ?? row['2k']
  return per * Math.max(1, count)
}

export function estimateVideoCredits(model, resolution, seconds = 5, count = 1) {
  const row = VIDEO_CREDITS_PER_SECOND[model]
  if (!row) return null
  const per = row[resolution] ?? row['1080p']
  return per * seconds * Math.max(1, count)
}
