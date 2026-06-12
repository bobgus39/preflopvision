import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_AUTH_KEY  = 'pv_auth_token'
const LS_QUIZ_KEY  = 'pv_quiz_daily'
const FREE_QUIZ_LIMIT = 10

export const FREE_POSITIONS  = new Set(['BTN', 'CO', 'BB'])
export const FREE_SITUATIONS = new Set(['RFI', 'vsBTN']) // RFI for BTN/CO, vsBTN for BB

// ─── Mock token helpers ────────────────────────────────────────────────────────

function makeToken(email, plan, days = 30) {
  return { email, plan, iat: Date.now(), exp: Date.now() + days * 86_400_000 }
}

function readToken() {
  try {
    const raw = localStorage.getItem(LS_AUTH_KEY)
    if (!raw) return null
    const t = JSON.parse(raw)
    if (t.exp < Date.now()) { localStorage.removeItem(LS_AUTH_KEY); return null }
    return t
  } catch { return null }
}

// ─── Quiz daily counter ────────────────────────────────────────────────────────

export function getQuizCountToday() {
  try {
    const raw = localStorage.getItem(LS_QUIZ_KEY)
    if (!raw) return 0
    const { date, count } = JSON.parse(raw)
    return new Date().toDateString() === date ? count : 0
  } catch { return 0 }
}

export function incrementQuizCount() {
  const count = getQuizCountToday() + 1
  localStorage.setItem(LS_QUIZ_KEY, JSON.stringify({ date: new Date().toDateString(), count }))
  return count
}

export function resetQuizCount() {
  localStorage.removeItem(LS_QUIZ_KEY)
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState = {
  user:         readToken(),
  pricingOpen:  false,
  upgradeFeature: null, // hint for which feature triggered the modal
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      const token = makeToken(action.email, action.plan, action.plan === 'pro' ? 365 : 3650)
      localStorage.setItem(LS_AUTH_KEY, JSON.stringify(token))
      return { ...state, user: token }
    }
    // Real Stripe session — use actual expiresAt from the subscription
    case 'LOGIN_STRIPE': {
      const token = {
        email:  action.email ?? 'user@preflop.vision',
        plan:   'pro',
        iat:    Date.now(),
        exp:    action.expiresAt ?? (Date.now() + 30 * 86_400_000),
      }
      localStorage.setItem(LS_AUTH_KEY, JSON.stringify(token))
      return { ...state, user: token }
    }
    case 'UPGRADE': {
      const email = state.user?.email || action.email || 'user@preflop.vision'
      const token = makeToken(email, 'pro', 30)
      localStorage.setItem(LS_AUTH_KEY, JSON.stringify(token))
      return { ...state, user: token, pricingOpen: false, upgradeFeature: null }
    }
    case 'LOGOUT': {
      localStorage.removeItem(LS_AUTH_KEY)
      return { ...state, user: null }
    }
    // Server confirmed subscription is still active — refresh local token
    case 'REFRESH_FROM_SERVER': {
      const token = {
        email:  action.email,
        plan:   'pro',
        iat:    Date.now(),
        exp:    action.expiresAt ?? (Date.now() + 30 * 86_400_000),
      }
      localStorage.setItem(LS_AUTH_KEY, JSON.stringify(token))
      return { ...state, user: token }
    }
    case 'OPEN_PRICING':
      return { ...state, pricingOpen: true, upgradeFeature: action.feature ?? null }
    case 'CLOSE_PRICING':
      return { ...state, pricingOpen: false, upgradeFeature: null }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // On mount: if there's a stored email, verify subscription status with server.
  // Uses cached localStorage value while loading (no flicker), then corrects silently.
  useEffect(() => {
    const token = readToken()
    if (!token?.email) return

    fetch(`/api/subscription?email=${encodeURIComponent(token.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'no_db') return  // Server without DB — trust localStorage
        if (data.isPro) {
          dispatch({ type: 'REFRESH_FROM_SERVER', email: token.email, expiresAt: data.expiresAt })
        } else {
          dispatch({ type: 'LOGOUT' })
        }
      })
      .catch(() => {
        // Server unreachable — keep local token as fallback
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isPro = useCallback(() => state.user?.plan === 'pro', [state.user])

  // Returns true when the feature should be blocked for the current user
  const isLocked = useCallback((feature) => {
    if (isPro()) return false

    // feature patterns:
    //   'pos:UTG'           – position lock
    //   'sit:BTN:vs3bet'    – situation lock
    //   'sit:BB:vsCO'       – BB situation lock
    //   'mtt_shallow'       – MTT 50bb / 25bb
    //   'quiz_unlimited'    – unlimited quiz
    if (feature.startsWith('pos:')) {
      return !FREE_POSITIONS.has(feature.slice(4))
    }
    if (feature.startsWith('sit:')) {
      const [, pos, sit] = feature.split(':')
      if (pos === 'BB') return sit !== 'vsBTN'
      return sit !== 'RFI'
    }
    if (feature === 'mtt_shallow') return true
    if (feature === 'quiz_unlimited') return true
    return false
  }, [isPro])

  const openPricing      = useCallback((feature) => dispatch({ type: 'OPEN_PRICING', feature }), [])
  const closePricing     = useCallback(() => dispatch({ type: 'CLOSE_PRICING' }), [])
  const login            = useCallback((email, plan) => dispatch({ type: 'LOGIN', email, plan }), [])
  // Called after verifying a real Stripe session on the success page
  const loginFromStripe  = useCallback((email, expiresAt) => dispatch({ type: 'LOGIN_STRIPE', email, expiresAt }), [])
  const logout           = useCallback(() => dispatch({ type: 'LOGOUT' }), [])
  const upgrade          = useCallback((email) => dispatch({ type: 'UPGRADE', email }), [])

  const value = {
    user: state.user,
    pricingOpen: state.pricingOpen,
    upgradeFeature: state.upgradeFeature,
    isPro,
    isLocked,
    openPricing,
    closePricing,
    login,
    loginFromStripe,
    logout,
    upgrade,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
