import { useEffect, useRef, useState } from 'react'
import { useNetworkStatus } from '../utils/network'

// Thin status bar under the nav: offline notice, queued-request count, and a
// short "back online" confirmation.
export default function OfflineBanner() {
  const { online, queued } = useNetworkStatus()
  const [showBack, setShowBack] = useState(false)
  const wasOffline = useRef(!online)

  useEffect(() => {
    if (!online) { wasOffline.current = true; setShowBack(false); return }
    if (wasOffline.current) {
      wasOffline.current = false
      setShowBack(true)
      const t = setTimeout(() => setShowBack(false), 3000)
      return () => clearTimeout(t)
    }
  }, [online])

  if (online && !showBack) return null

  const text = online
    ? 'Back online — queued requests are sending.'
    : queued > 0
      ? `You're offline. ${queued} generation request${queued === 1 ? '' : 's'} will send when you reconnect.`
      : "You're offline. Your influencers and saved media are still available. New generation requests will wait and send when you reconnect."

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky', top: 'var(--nav-h)', zIndex: 150,
        padding: '8px 16px', textAlign: 'center',
        fontSize: 13, fontWeight: 500,
        background: online ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: online ? '#fff' : 'var(--text-primary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {text}
    </div>
  )
}
