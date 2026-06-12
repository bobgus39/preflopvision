import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useStripeCheckout } from '../hooks/useStripeCheckout'

const FREE_FEATURES = [
  { ok: true,  text: '3 posiciones: BTN, CO, BB' },
  { ok: true,  text: 'Situación RFI' },
  { ok: true,  text: 'Matriz de rangos 13×13' },
  { ok: true,  text: 'Quiz Mode (10 preguntas/día)' },
  { ok: false, text: 'Posiciones early: UTG, HJ, SB' },
  { ok: false, text: 'vs 3-Bet, vs Open, Squeeze' },
  { ok: false, text: 'Rangos MTT 50bb / 25bb' },
  { ok: false, text: 'Quiz ilimitado + estadísticas' },
  { ok: false, text: 'Exportar rangos PDF' },
]

const PRO_FEATURES = [
  { text: 'Todas las posiciones (UTG, HJ, CO, BTN, SB, BB)' },
  { text: 'Todas las situaciones: RFI, vs 3-Bet, vs Open, Squeeze' },
  { text: 'Rangos MTT 100bb / 50bb / 25bb' },
  { text: 'Quiz Mode ilimitado + estadísticas de progreso' },
  { text: 'Exportar rangos en PDF' },
  { text: 'Acceso a rangos futuros y actualizaciones' },
  { text: 'Soporte prioritario por email' },
]

// ─── Billing toggle ───────────────────────────────────────────────────────────

function BillingToggle({ annual, setAnnual }) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 bg-surface rounded-full p-1 border border-gold/15">
        <button
          onClick={() => setAnnual(false)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            !annual ? 'bg-gold/20 text-gold shadow-gold-sm' : 'text-cream-muted hover:text-cream'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
            annual ? 'bg-gold/20 text-gold shadow-gold-sm' : 'text-cream-muted hover:text-cream'
          }`}
        >
          Anual
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success/20 text-success">
            -42%
          </span>
        </button>
      </div>
    </div>
  )
}

// ─── Pricing cards ────────────────────────────────────────────────────────────

function FreeCard() {
  const { isPro } = useAuth()
  return (
    <div className="rounded-2xl p-6 sm:p-8 border border-gold/10 bg-surface flex flex-col h-full">
      <div className="mb-6">
        <p className="text-cream-muted text-xs font-semibold uppercase tracking-widest mb-2">Para empezar</p>
        <h3 className="font-display text-2xl font-bold text-cream mb-3">Free</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-cream-dim">€0</span>
          <span className="text-cream-muted">/siempre</span>
        </div>
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {FREE_FEATURES.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className={`flex-shrink-0 mt-0.5 font-bold ${f.ok ? 'text-success' : 'text-cream-muted/30'}`}>
              {f.ok ? '✓' : '✗'}
            </span>
            <span className={f.ok ? 'text-cream-dim' : 'text-cream-muted/30 line-through'}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        disabled
        className="w-full py-3 rounded-xl text-sm font-bold bg-surface-2 text-cream-muted cursor-not-allowed border border-gold/10"
      >
        {isPro() ? 'Plan anterior' : 'Plan actual'}
      </button>
    </div>
  )
}

function ProCard({ annual }) {
  const { isPro, user } = useAuth()
  const { redirectToCheckout, loading, error } = useStripeCheckout()

  const plan   = annual ? 'yearly' : 'monthly'
  const price  = annual ? '49' : '7'
  const period = annual ? '/año' : '/mes'

  return (
    <motion.div
      className="rounded-2xl p-6 sm:p-8 flex flex-col h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(201,168,76,0.1) 0%, rgba(14,14,22,1) 55%)',
        border: '1.5px solid rgba(201,168,76,0.45)',
      }}
      whileHover={{ boxShadow: '0 0 40px rgba(201,168,76,0.18)' }}
    >
      {/* Popular ribbon */}
      <div className="absolute top-5 right-5">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold text-bg uppercase tracking-wider">
          Más popular
        </span>
      </div>

      {/* Animated price transition */}
      <div className="mb-6">
        <p className="text-gold/70 text-xs font-semibold uppercase tracking-widest mb-2">Acceso completo</p>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display text-2xl font-bold text-gold">Pro</h3>
          <span className="text-gold/60 text-lg">✦</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={plan}
            className="flex items-baseline gap-1"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-4xl font-bold text-cream">€{price}</span>
            <span className="text-cream-muted">{period}</span>
          </motion.div>
        </AnimatePresence>
        {annual && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-success text-xs font-semibold mt-1"
          >
            Ahorra €35 respecto al mensual
          </motion.p>
        )}
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {PRO_FEATURES.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="text-gold flex-shrink-0 mt-0.5 font-bold">✓</span>
            <span className="text-cream-dim">{f.text}</span>
          </li>
        ))}
      </ul>

      {isPro() ? (
        <div className="w-full py-3 rounded-xl text-sm font-bold text-center bg-gold/15 border border-gold/40 text-gold">
          Plan activo ✦
        </div>
      ) : (
        <>
          <motion.button
            onClick={() => redirectToCheckout(plan, user?.email)}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-base font-display tracking-wide text-bg relative overflow-hidden"
            style={{ background: loading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, #E8C76B 0%, #C9A84C 100%)' }}
            whileHover={!loading ? { scale: 1.02, boxShadow: '0 4px 24px rgba(201,168,76,0.45)' } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  className="w-4 h-4 rounded-full border-2 border-bg/30 border-t-bg inline-block"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Redirigiendo a Stripe...
              </span>
            ) : (
              `Empezar Pro${annual ? ' — €49/año' : ' — €7/mes'} →`
            )}
          </motion.button>

          {error && (
            <p className="text-danger text-xs mt-2 text-center">{error}</p>
          )}

          <p className="text-cream-muted/50 text-[10px] text-center mt-3">
            Pago seguro con Stripe · Cancela cuando quieras
          </p>
        </>
      )}
    </motion.div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. Cancela desde el portal de Stripe en cualquier momento. Tu acceso Pro permanece activo hasta el final del período pagado.',
  },
  {
    q: '¿Los rangos son realmente GTO?',
    a: 'Son aproximaciones validadas a soluciones de GTO Wizard y PioSOLVER para 6-max NLHE 100bb. Para uso educativo — ajusta según tu mesa.',
  },
  {
    q: '¿Qué pasa si cambio de mensual a anual?',
    a: 'Cancela el mensual y contrata el anual. Stripe prorrateará el cambio automáticamente si lo gestionas desde el portal de cliente.',
  },
]

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <div className="max-w-2xl mx-auto mt-16">
      <h2 className="font-display text-xl font-bold text-cream text-center mb-6">
        Preguntas frecuentes
      </h2>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="glass-panel rounded-xl border border-gold/10 overflow-hidden"
          >
            <button
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-sm font-semibold text-cream">{faq.q}</span>
              <motion.span
                className="text-gold/60 flex-shrink-0"
                animate={{ rotate: open === i ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                +
              </motion.span>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="px-5 pb-4 text-sm text-cream-dim leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg text-cream font-body">
      <div className="hero-glow" />

      {/* Header */}
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

        <div className="flex-1" />

        <button
          onClick={() => navigate('/')}
          className="text-xs text-cream-muted hover:text-cream border border-gold/15 hover:border-gold/30 px-3 py-1.5 rounded-lg transition-all"
        >
          ← Volver a la app
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-20">

        {/* Hero text */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-gold/70 text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              Pricing
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-cream mb-4">
              Elige tu plan
            </h1>
            <p className="text-cream-dim text-lg max-w-xl mx-auto">
              Domina el preflop con rangos GTO para todas las posiciones y situaciones.
            </p>
          </motion.div>
        </div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <BillingToggle annual={annual} setAnnual={setAnnual} />
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid sm:grid-cols-2 gap-6 items-stretch"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <FreeCard />
          <ProCard annual={annual} />
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <FAQ />
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-cream-muted/40 text-xs mt-12">
          Rangos para uso educativo. Preflop Vision no garantiza resultados en el juego real.
        </p>
      </main>
    </div>
  )
}
