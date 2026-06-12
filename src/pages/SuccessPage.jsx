import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { verifyStripeSession } from '../hooks/useStripeCheckout'

// ─── Confetti particles ───────────────────────────────────────────────────────

const EMOJIS = ['🎉', '✨', '♠', '♦', '🃏', '⭐', '💫', '🏆']

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id:       i,
      emoji:    EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x:        Math.random() * 100,          // % from left
      delay:    Math.random() * 1.2,
      duration: 2 + Math.random() * 1.5,
      rotate:   Math.random() > 0.5 ? 720 : -720,
      size:     14 + Math.floor(Math.random() * 14),
    })), [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{ left: `${p.x}%`, top: '-6%', fontSize: p.size }}
          animate={{ y: '115vh', rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Status variants ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-5">
      <motion.div
        className="w-16 h-16 rounded-full border-2 border-gold/20 border-t-gold"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <div className="text-center">
        <p className="text-cream font-semibold text-lg mb-1">Verificando pago...</p>
        <p className="text-cream-muted text-sm">Conectando con Stripe</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="text-5xl">⚠️</div>
      <div>
        <p className="text-cream font-semibold text-lg mb-1">No se pudo verificar el pago</p>
        <p className="text-cream-muted text-sm max-w-xs leading-relaxed">
          {message ?? 'El pago no se completó o el enlace expiró. Si fuiste cobrado, contacta soporte.'}
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-lg bg-surface-2 border border-gold/20 text-cream text-sm font-semibold hover:border-gold/40 transition-all"
        >
          Reintentar
        </button>
        <button
          onClick={() => navigate('/#/pricing')}
          className="px-5 py-2.5 rounded-lg bg-gold/15 border border-gold/35 text-gold text-sm font-semibold hover:bg-gold/25 transition-all"
        >
          Ver planes
        </button>
      </div>
    </div>
  )
}

function SuccessState({ email, planLabel, navigate }) {
  return (
    <>
      <Confetti />

      <motion.div
        className="flex flex-col items-center text-center gap-5"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Trophy */}
        <motion.div
          className="text-7xl"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
        >
          🏆
        </motion.div>

        {/* Pro badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))',
            borderColor: 'rgba(201,168,76,0.5)',
          }}
        >
          <span className="font-display text-gold font-bold text-sm tracking-wider">PRO</span>
          <span className="text-gold/70">✦</span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #E8C76B 0%, #C9A84C 60%, #E8C76B 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            ¡Ya eres Pro! ✦
          </h1>
          {email && (
            <p className="text-cream-dim text-sm">
              Confirmación enviada a <strong className="text-cream">{email}</strong>
            </p>
          )}
        </motion.div>

        {/* Feature highlights */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-2 gap-2 text-left"
        >
          {[
            'Todas las posiciones desbloqueadas',
            'Situaciones: vs 3-Bet, Open, Squeeze',
            'Rangos MTT multi-stack',
            'Quiz Mode ilimitado',
          ].map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="text-gold mt-0.5 flex-shrink-0">✓</span>
              <span className="text-cream-dim">{f}</span>
            </li>
          ))}
        </motion.ul>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-3.5 rounded-xl font-bold text-base font-display tracking-wide text-bg mt-2"
          style={{ background: 'linear-gradient(135deg, #E8C76B 0%, #C9A84C 100%)' }}
          whileHover={{ scale: 1.02, boxShadow: '0 4px 24px rgba(201,168,76,0.45)' }}
          whileTap={{ scale: 0.98 }}
        >
          Ir a la app →
        </motion.button>

        {planLabel && (
          <p className="text-cream-muted/50 text-[10px]">Plan {planLabel} activado</p>
        )}
      </motion.div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SuccessPage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { loginFromStripe } = useAuth()

  const [status,    setStatus]    = useState('loading')  // loading | success | error
  const [userEmail, setUserEmail] = useState(null)
  const [planLabel, setPlanLabel] = useState(null)
  const [errMsg,    setErrMsg]    = useState(null)

  function getSessionId() {
    // location.search works correctly with HashRouter: /#/success?session_id=xxx
    return new URLSearchParams(location.search).get('session_id')
  }

  async function verify() {
    const sessionId = getSessionId()

    if (!sessionId) {
      setErrMsg('No se encontró session_id en la URL.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrMsg(null)

    try {
      const data = await verifyStripeSession(sessionId)

      if (!data.success) {
        setErrMsg(data.error ?? 'El pago no se completó.')
        setStatus('error')
        return
      }

      // Persist Pro status in AuthContext + localStorage
      loginFromStripe(data.email, data.expiresAt)
      setUserEmail(data.email)
      setPlanLabel(data.plan === 'yearly' ? 'Anual (€49/año)' : 'Mensual (€7/mes)')
      setStatus('success')
    } catch (err) {
      setErrMsg(err.message)
      setStatus('error')
    }
  }

  useEffect(() => { verify() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-bg text-cream font-body flex flex-col">
      <div className="hero-glow" />

      {/* Minimal header */}
      <header className="relative z-10 border-b border-gold/10 h-[60px] flex items-center px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <span className="text-2xl">🃏</span>
          <span className="font-display font-bold text-base gold-text tracking-wider group-hover:opacity-80 transition-opacity">
            PREFLOP VISION
          </span>
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div
          className="glass-panel rounded-2xl p-8 sm:p-12 w-full max-w-md"
          style={{ border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <LoadingState />
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <ErrorState message={errMsg} onRetry={verify} />
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div key="success"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <SuccessState
                  email={userEmail}
                  planLabel={planLabel}
                  navigate={navigate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
