// Seedance 2.5 text-to-video through the official Higgsfield SDK (server-side only).
//
//   npm run hf:example
//
// Credentials: HF_CREDENTIALS="key-id:key-secret" in .env.local (git-ignored), loaded
// at runtime. The value is never printed. This makes a billable generation request.
//
// Model reference: https://console.higgsfield.ai/models/bytedance/seedance-2.5/text-to-video/api-reference
// SDK reference:   https://docs.higgsfield.ai/docs/how-to/sdk
import { config as loadEnv } from 'dotenv'
import { config, higgsfield } from '@higgsfield/client/v2'

loadEnv({ path: new URL('../../.env.local', import.meta.url).pathname, quiet: true })

const MODEL = 'bytedance/seedance-2.5/text-to-video'
const INPUT = { prompt: 'A cinematic scene at sunset', duration: 5, resolution: '720p', aspect_ratio: '16:9' }

// Plain-text error detail without request config (which holds the Authorization header).
function describe(err) {
  const status = err?.response?.status
  const detail = err?.response?.data?.detail
  const text = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join('; ') : ''
  return [err?.name && err.name !== 'Error' ? err.name : '', status ? `HTTP ${status}` : '', text || err?.message || 'Unknown error'].filter(Boolean).join(' · ')
}

async function main() {
  if (!/^[^:\s]+:[^:\s]+$/.test(process.env.HF_CREDENTIALS || '')) {
    console.error('HF_CREDENTIALS is missing or not in key-id:key-secret format. Add it to .env.local.')
    return 1
  }
  // Videos can take longer than the SDK's 5-minute default; poll every 5 s for up to 20 min.
  config({ credentials: process.env.HF_CREDENTIALS, pollInterval: 5000, maxPollTime: 20 * 60 * 1000 })

  console.log(`Submitting ${MODEL}: ${JSON.stringify(INPUT)}`)
  let result
  try {
    result = await higgsfield.subscribe(MODEL, { input: INPUT, withPolling: true })
  } catch (err) {
    // The SDK keeps polling a canceled request until maxPollTime, so a timeout can mean
    // canceled or still running; it is never reported as success.
    console.error(`Request did not complete: ${describe(err)}`)
    return 1
  }

  const id = result?.request_id ? ` (request ${result.request_id})` : ''
  switch (result?.status) {
    case 'completed': {
      const url = result.video?.url
      if (!url) { console.error(`Completed${id} but no video URL was returned.`); return 1 }
      console.log(`Completed${id}`)
      console.log(`Video URL: ${url}`)
      if (result.expires_at) console.log(`Available until: ${result.expires_at}`)
      return 0
    }
    case 'nsfw': console.error(`Rejected by content moderation${id}. Not charged.`); return 1
    case 'failed': console.error(`Generation failed${id}: ${result.error || 'no error message'}. Not charged.`); return 1
    case 'canceled': console.error(`Request was canceled${id}.`); return 1
    default: console.error(`Unexpected status "${result?.status}"${id}.`); return 1
  }
}

process.exitCode = await main()
