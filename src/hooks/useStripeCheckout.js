import { useState, useCallback } from 'react'

// In development: empty string → Vite proxy forwards /api/* to localhost:3001
// In production: set VITE_API_URL to your deployed backend URL
const API_BASE = import.meta.env.VITE_API_URL ?? ''

/**
 * Hook for redirecting to Stripe Checkout.
 *
 * Usage:
 *   const { redirectToCheckout, loading, error } = useStripeCheckout()
 *   <button onClick={() => redirectToCheckout('monthly', user?.email)} />
 */
export function useStripeCheckout() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const redirectToCheckout = useCallback(async (plan = 'monthly', email) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan, email: email || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      if (!data.url) {
        throw new Error('No checkout URL returned from server')
      }

      // Hard redirect — Stripe takes over from here
      window.location.href = data.url
    } catch (err) {
      console.error('[useStripeCheckout]', err)
      setError(err.message)
      setLoading(false)
    }
    // If redirect succeeds, component unmounts — no need to setLoading(false)
  }, [])

  return { redirectToCheckout, loading, error }
}

/**
 * Verify a completed Stripe session and return the user data.
 * Called once from SuccessPage after redirect back from Stripe.
 */
export async function verifyStripeSession(sessionId) {
  const res  = await fetch(`${API_BASE}/api/verify-session/${sessionId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data // { success, email, plan, expiresAt }
}
