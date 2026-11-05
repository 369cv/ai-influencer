// Online/offline state + a wait queue for requests made while offline.
//
// Higgsfield calls go through `whenOnline()`. Offline, a call waits instead of
// failing and is sent as soon as the browser reports a connection again. The
// queue lives in memory, so it holds only while the tab stays open; jobs that
// were already submitted survive reloads via the existing pending-job keys in
// higgsfieldGenerate.js.

import { useEffect, useState } from 'react'

const listeners = new Set()
let waiting = 0

function snapshot() {
  return { online: typeof navigator === 'undefined' ? true : navigator.onLine, queued: waiting }
}

function emit() {
  const s = snapshot()
  listeners.forEach(fn => fn(s))
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', emit)
  window.addEventListener('offline', emit)
}

export function isOnline() {
  return snapshot().online
}

// Resolves immediately when online; otherwise waits for the `online` event.
export function whenOnline() {
  if (isOnline()) return Promise.resolve()
  waiting++
  emit()
  return new Promise(resolve => {
    const done = () => {
      window.removeEventListener('online', done)
      waiting = Math.max(0, waiting - 1)
      emit()
      resolve()
    }
    window.addEventListener('online', done)
  })
}

export function useNetworkStatus() {
  const [state, setState] = useState(snapshot)
  useEffect(() => {
    listeners.add(setState)
    setState(snapshot())
    return () => listeners.delete(setState)
  }, [])
  return state
}
