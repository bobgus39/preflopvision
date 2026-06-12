import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useStripeCheckout } from '../hooks/useStripeCheckout'

// ─── Plan feature lists ───────────────────────────────────────────────────────

const FREE_FEATURES = [
  { ok: true,  text: '3 posiciones: BTN, CO, BB' },
  { ok: true,  text: 'Situación RFI' },
  { ok: true,  text: 'Matriz de rangos 13×13' },
  { ok: true,  text: 'Quiz Mode (10 preguntas/día)' },
  { ok: false, text: 'Posiciones early: UTG, HJ, SB' },
  { ok: false, text: 'Situaciones: vs 3-Bet, vs Open, Squeeze' },
  { ok: false, text: 'Rangos MTT multi-stack (50bb / 25bb)' },
  { ok: false, text: 'Estadísticas de progreso' },
  { ok: false, text: 'Exportar rangos PDF' },
]

const PRO_FEATURES = [
  { text: 'Todas las posiciones (UTG, HJ, CO, BTN, SB, BB)' },
  { text: 'Todas las situaciones (RFI, vs 3-Bet, vs Open, Squeeze)' },
  { text: 'Rangos MTT 100bb / 50bb / 25bb' },
  { text: 'Quiz Mode ilimitado + estadísticas' },
  { text: 'Seguimiento de progreso por sesión' },
  { text: 'Exportar rangos en PDF' },
  { text: 'Acceso a rangos futuros y updates' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingModal() {
  const { user, pricingOpen, closePricing, isPro } = useAuth()
  const { redirectToCheckout, loading, error }     = useStripeCheckout()
  const navigate = useNavigate()

  const [annual, setAnnual] = useState(false)

  const plan    = annual ? 'yearly' : 'monthly'
  const price   = annual ? '49' : '7'
  const period  = annual ? '/año' : '/mes'
  const savings = annual ? 'Ahorra €35 vs mensual' : null

  function resetAndClose() {
    closePricing()
  }

  const handleCheckout = useCallback(() => {
    redirectToCheckout(plan, user?.email)
    // window.location.href happens inside the hook — modal stays open briefly
  }, [plan, user?.email, redirectToCheckout])

  if (!pricingOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        key="pricing-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) resetAndClose() }}
      >
        <motion.div
          className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
          style={{ background: '#12121C', border: '1px solid rgba(201,168,76,0.2)' }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Decorative top bar */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />

          {/* Close */}
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface-3 text-cream-muted hover:text-cream transition-all text-xl z-10"
          >
            ×
          </button>

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold text-cream mb-1">
                Elige tu Plan
              </h2>
              <p className="text-sm text-cream-dim">
                Desbloquea todas las herramientas GTO para mejorar tu juego
              </p>
            </div>

            {/* Billing toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-1 bg-surface rounded-full p-1 border border-gold/15">
                <button
                  onClick={() => setAnnual(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    !annual ? 'bg-gold/20 text-gold' : 'text-cream-muted'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    annual ? 'bg-gold/20 text-gold' : 'text-cream-muted'
                  }`}
                >
                  Anual
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/20 text-success font-bold">-42%</span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid sm:grid-cols-2 gap-4">

              {/* FREE */}
              <div className="rounded-xl p-5 border border-gold/10 bg-surface flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-lg text-cream">Free</h3>
                    <span className="text-xs text-cream-muted px-2 py-0.5 rounded-full bg-surface-2 border border-gold/10">
                      {isPro() ? 'Plan anterior' : 'Plan actual'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-cream-dim">€0</span>
                    <span className="text-cream-muted text-sm">/siempre</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2 mb-5">
                  {FREE_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 mt-0.5 ${f.ok ? 'text-success' : 'text-cream-muted/40'}`}>
                        {f.ok ? '✓' : '✗'}
                      </span>
                      <span className={f.ok ? 'text-cream-dim' : 'text-cream-muted/40 line-through'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-surface-2 text-cream-muted cursor-not-allowed border border-gold/10"
                >
                  {isPro() ? 'Plan anterior' : 'Plan actual'}
                </button>
              </div>

              {/* PRO */}
              <motion.div
                className="rounded-xl p-5 flex flex-col relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(201,168,76,0.08) 0%, rgba(26,26,36,1) 60%)',
                  border: '1.5px solid rgba(201,168,76,0.45)',
                }}
                whileHover={{ boxShadow: '0 0 30px rgba(201,168,76,0.2)' }}
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-bg uppercase tracking-wider">
                    Popular
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg text-gold">Pro</h3>
                    <span className="text-gold/70 text-[10px]">✦</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={plan}
                      className="flex items-baseline gap-1"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span className="text-3xl font-bold text-cream">€{price}</span>
                      <span className="text-cream-muted text-sm">{period}</span>
                    </motion.div>
                  </AnimatePresence>
                  {savings && (
                    <p className="text-[10px] text-success font-semibold mt-0.5">{savings}</p>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-5">
                  {PRO_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex-shrink-0 mt-0.5 text-gold">✓</span>
                      <span className="text-cream-dim">{f.text}</span>
                    </li>
                  ))}
                </ul>

                {isPro() ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center bg-gold/20 border border-gold/40 text-gold">
                    Plan activo ✦
                  </div>
                ) : (
                  <>
                    <motion.button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-sm font-bold font-display tracking-wide text-bg"
                      style={{ background: loading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, #E8C76B 0%, #C9A84C 100%)' }}
                      whileHover={!loading ? { scale: 1.02, boxShadow: '0 4px 20px rgba(201,168,76,0.4)' } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <motion.span
                            className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg inline-block"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          />
                          Redirigiendo...
                        </span>
                      ) : (
                        'Empezar Pro →'
                      )}
                    </motion.button>

                    {error && (
                      <p className="text-danger text-[10px] mt-1.5 text-center">{error}</p>
                    )}
                  </>
                )}
              </motion.div>
            </div>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => { resetAndClose(); navigate('/pricing') }}
                className="text-xs text-cream-muted hover:text-cream underline underline-offset-2 transition-colors"
              >
                Ver página de precios completa →
              </button>
              <span className="text-cream-muted/30 text-xs">·</span>
              <span className="text-[10px] text-cream-muted/50">
                🔒 Pago seguro con Stripe
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
