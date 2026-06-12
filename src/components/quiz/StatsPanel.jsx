import { motion } from 'framer-motion'
import { getTopWeakSpots } from '../../quiz/quizStats'
import { SITUATION_LABELS } from '../../data/ranges'

const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ label, value, color = 'text-cream', suffix = '' }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold font-display leading-none ${color}`}>
        {value}{suffix}
      </div>
      <div className="text-[10px] text-cream-muted uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

// ─── Position bars (custom animated chart) ────────────────────────────────────

function PositionBars({ byPosition }) {
  const entries = ALL_POSITIONS
    .map(pos => ({ pos, ...(byPosition[pos] || { correct: 0, total: 0 }) }))
    .filter(e => e.total > 0)

  if (!entries.length) {
    return (
      <p className="text-[11px] text-cream-muted/40 text-center py-2 italic">
        Sin datos aún
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(({ pos, correct, total }, i) => {
        const pct   = Math.round((correct / total) * 100)
        const color = pct >= 70 ? '#2ECC71' : pct >= 50 ? '#C9A84C' : '#E74C3C'
        return (
          <div key={pos} className="flex items-center gap-2">
            <span className="font-display text-[10px] text-cream-muted/70 w-7 flex-shrink-0">{pos}</span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.06 }}
              />
            </div>
            <span
              className="text-[10px] font-bold w-8 text-right tabular-nums flex-shrink-0"
              style={{ color }}
            >
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Weak spot row ────────────────────────────────────────────────────────────

function WeakSpotRow({ spot }) {
  const sitLabel = SITUATION_LABELS?.[spot.situation] ?? spot.situation
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gold/6 last:border-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-display text-xs font-bold text-cream flex-shrink-0">{spot.hand}</span>
        <span className="text-[10px] text-cream-muted truncate">
          {spot.position} · {sitLabel}
        </span>
      </div>
      <span className="text-danger text-[11px] font-bold flex-shrink-0 ml-2">×{spot.errors}</span>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function StatsPanel({ stats, streak }) {
  const accuracy  = stats.totalAnswered > 0
    ? Math.round((stats.correct / stats.totalAnswered) * 100)
    : 0
  const isOnFire  = streak >= 5
  const weakSpots = getTopWeakSpots(stats)

  return (
    <div className="space-y-3">

      {/* Overall stats */}
      <div className="glass-panel rounded-xl p-4">
        <div className="text-[10px] font-display font-bold text-gold uppercase tracking-widest mb-3">
          Estadísticas
        </div>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          <StatCell
            label="Precisión"
            value={`${accuracy}%`}
            color="text-gold"
          />
          <StatCell
            label="Total"
            value={stats.totalAnswered}
          />
          <StatCell
            label="Racha"
            value={streak}
            color={isOnFire ? 'text-orange-400' : 'text-cream'}
            suffix={isOnFire ? ' 🔥' : ''}
          />
          <StatCell
            label="Mejor racha"
            value={stats.bestStreak || 0}
            color="text-gold"
          />
        </div>
      </div>

      {/* Position breakdown */}
      <div className="glass-panel rounded-xl p-4">
        <div className="text-[10px] font-display font-bold text-gold uppercase tracking-widest mb-3">
          Por Posición
        </div>
        <PositionBars byPosition={stats.byPosition} />
      </div>

      {/* Weak spots — only rendered when there's data */}
      {weakSpots.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="text-[10px] font-display font-bold text-gold uppercase tracking-widest mb-2">
            Puntos Débiles
          </div>
          <div>
            {weakSpots.map(spot => (
              <WeakSpotRow
                key={`${spot.hand}|${spot.position}|${spot.situation}`}
                spot={spot}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
