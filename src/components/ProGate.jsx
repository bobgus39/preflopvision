import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const FEATURE_LABELS = {
  'mtt_shallow':     'Rangos MTT 50bb / 25bb',
  'quiz_unlimited':  'Quiz Mode ilimitado',
}

function featureLabel(feature) {
  if (FEATURE_LABELS[feature]) return FEATURE_LABELS[feature]
  if (feature?.startsWith('pos:'))  return `Posición ${feature.slice(4)}`
  if (feature?.startsWith('sit:')) {
    const sit = feature.split(':')[2]
    const labels = {
      vs3bet: 'vs 3-Bet', vsOpenCall: 'vs Open (Call)',
      vsOpen3bet: 'vs Open (3-Bet)', squeeze: 'Squeeze',
      vsSB: 'vs SB', vsCO: 'vs CO', vsHJ: 'vs HJ', vsUTG: 'vs UTG',
    }
    return labels[sit] ?? sit
  }
  return 'Esta función'
}

// ─── Animated lock icon ───────────────────────────────────────────────────────

function LockIcon() {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className="mb-3"
    >
      <div className="relative w-14 h-14 mx-auto">
        {/* Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.35) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          🔒
        </div>
      </div>
    </motion.div>
  )
}

// ─── ProGate component ────────────────────────────────────────────────────────

/**
 * Wraps content with a Pro-gate overlay when `feature` is locked.
 *
 * Props:
 *   feature   – feature key checked against isLocked()
 *   children  – content to blur behind the gate
 *   compact   – smaller overlay variant (for tabs, badges, etc.)
 *   minHeight – CSS min-height for the overlay container
 */
export default function ProGate({ feature, children, compact = false, minHeight }) {
  const { isLocked, openPricing } = useAuth()

  if (!isLocked(feature)) return <>{children}</>

  const label = featureLabel(feature)

  return (
    <div className="relative" style={minHeight ? { minHeight } : undefined}>
      {/* Blurred content behind gate */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: 'blur(5px)', opacity: 0.25 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-20"
        style={{
          background: 'rgba(13,13,18,0.75)',
          backdropFilter: 'blur(2px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {compact ? (
          /* Compact variant — for small containers */
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-xs font-semibold text-cream-dim">Plan Pro</p>
            <button
              onClick={() => openPricing(feature)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 transition-all"
            >
              Desbloquear
            </button>
          </div>
        ) : (
          /* Full variant */
          <div className="flex flex-col items-center text-center px-6 max-w-xs">
            <LockIcon />

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 mb-3">
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Plan Pro</span>
            </div>

            <h3 className="font-display text-lg font-bold text-cream mb-1.5">
              {label}
            </h3>
            <p className="text-xs text-cream-dim leading-relaxed mb-5">
              Accede a todas las posiciones, situaciones y rangos avanzados con el Plan Pro.
            </p>

            <motion.button
              onClick={() => openPricing(feature)}
              className="w-full py-3 rounded-xl font-bold text-sm font-display tracking-wide border-2 mb-3 transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.12) 100%)',
                borderColor: '#C9A84C',
                color: '#E8C76B',
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(201,168,76,0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Desbloquear por €7/mes
            </motion.button>

            <button
              onClick={() => openPricing(feature)}
              className="text-xs text-cream-muted hover:text-cream-dim underline underline-offset-2 transition-colors"
            >
              Ver todas las funciones Pro →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
