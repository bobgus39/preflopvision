// Affiliate click tracking — localStorage + optional backend analytics

const CLICKS_KEY       = 'pv_affiliate_clicks'
const POST_QUIZ_KEY    = 'pv_post_quiz_affiliate'
const BAR_DISMISS_KEY  = 'pv_affiliate_bar_dismissed'
const API_BASE         = import.meta.env.VITE_API_URL ?? ''

// Record a click, then open the affiliate URL in a new tab
// source: 'sidebar' | 'bottom_bar' | 'play_page' | 'post_quiz' | 'pro_modal'
export function trackAffiliateClick(roomId, source, affiliateUrl) {
  // Persist locally
  try {
    const stored = JSON.parse(localStorage.getItem(CLICKS_KEY) || '[]')
    stored.push({ room: roomId, source, timestamp: Date.now() })
    localStorage.setItem(CLICKS_KEY, JSON.stringify(stored.slice(-200)))
  } catch {}

  // Fire-and-forget POST — don't block navigation on failure
  try {
    fetch(`${API_BASE}/api/affiliate-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomId, source, ts: Date.now() }),
    }).catch(() => {})
  } catch {}

  window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
}

// Post-quiz prompt: show once per day
export function shouldShowPostQuizAffiliate() {
  try {
    const raw = localStorage.getItem(POST_QUIZ_KEY)
    if (!raw) return true
    return JSON.parse(raw).date !== new Date().toDateString()
  } catch {
    return true
  }
}

export function markPostQuizAffiliateShown() {
  try {
    localStorage.setItem(POST_QUIZ_KEY, JSON.stringify({ date: new Date().toDateString() }))
  } catch {}
}

// Affiliate bar: dismissed for N ms (default 7 days)
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

export function isBarDismissed() {
  try {
    const raw = localStorage.getItem(BAR_DISMISS_KEY)
    if (!raw) return false
    return Date.now() < JSON.parse(raw).until
  } catch {
    return false
  }
}

export function dismissBar() {
  try {
    localStorage.setItem(BAR_DISMISS_KEY, JSON.stringify({ until: Date.now() + DISMISS_MS }))
  } catch {}
}
