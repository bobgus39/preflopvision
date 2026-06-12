import { motion } from 'framer-motion'
import { getHandName, getCombos, ACTION_COLORS, ACTION_LABELS, SITUATION_LABELS } from '../data/ranges'

const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣']
const SUIT_COLORS = ['#1a1a2a', '#c0392b', '#c0392b', '#1a1a2a']

function PlayingCard({ rank, suitIndex = 0 }) {
  const suit = SUIT_SYMBOLS[suitIndex]
  const color = SUIT_COLORS[suitIndex]
  const isRed = suitIndex === 1 || suitIndex === 2

  return (
    <div className="playing-card" style={{ color }}>
      <div className="self-start text-left leading-none" style={{ fontSize: 13, fontWeight: 800 }}>
        <div>{rank}</div>
        <div style={{ fontSize: 11 }}>{suit}</div>
      </div>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{suit}</div>
      <div className="self-end text-right leading-none rotate-180" style={{ fontSize: 13, fontWeight: 800 }}>
        <div>{rank}</div>
        <div style={{ fontSize: 11 }}>{suit}</div>
      </div>
    </div>
  )
}

function HandCards({ hand }) {
  if (!hand) return null
  const isPair = hand.length === 2
  const isSuited = hand.endsWith('s')
  const r1 = hand[0]
  const r2 = hand.length === 2 ? hand[1] : hand[1]

  if (isPair) {
    return (
      <div className="flex gap-2 justify-center mb-4">
        <PlayingCard rank={r1} suitIndex={0} />
        <PlayingCard rank={r2} suitIndex={1} />
      </div>
    )
  }

  if (isSuited) {
    return (
      <div className="flex gap-2 justify-center mb-4">
        <PlayingCard rank={r1} suitIndex={0} />
        <PlayingCard rank={r2} suitIndex={0} />
      </div>
    )
  }

  // offsuit
  return (
    <div className="flex gap-2 justify-center mb-4">
      <PlayingCard rank={r1} suitIndex={0} />
      <PlayingCard rank={r2} suitIndex={1} />
    </div>
  )
}

function FrequencyBar({ action, frequency }) {
  const color = ACTION_COLORS[action] || '#888'
  const pct = Math.round((frequency || 0) * 100)

  if (action === 'fold') {
    return (
      <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full bg-fold-cell" style={{ width: '100%' }} />
      </div>
    )
  }

  if (action === 'raise' || action === 'call') {
    return (
      <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    )
  }

  if (action === 'mixed_rf') {
    return (
      <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden flex">
        <motion.div
          className="h-full"
          style={{ background: ACTION_COLORS.raise, borderRadius: '9999px 0 0 9999px' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <div className="h-full flex-1 bg-surface-3" style={{ borderRadius: '0 9999px 9999px 0' }} />
      </div>
    )
  }

  if (action === 'mixed_rc') {
    return (
      <div className="w-full h-2 rounded-full overflow-hidden flex">
        <motion.div
          className="h-full"
          style={{ background: ACTION_COLORS.raise }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <div className="h-full flex-1" style={{ background: ACTION_COLORS.call }} />
      </div>
    )
  }

  return null
}

// Rough equity estimates for common hands
function getEquityNote(hand) {
  const r1 = hand[0], r2 = hand.length === 2 ? hand[1] : hand[1]
  const isSuited = hand.endsWith('s')
  const isPair = hand.length === 2 && hand[0] === hand[1]

  if (isPair) {
    const pairRanks = { A: 85, K: 83, Q: 80, J: 77, T: 75, '9': 72, '8': 69, '7': 66, '6': 63, '5': 60, '4': 57, '3': 54, '2': 51 }
    const eq = pairRanks[r1] || 60
    return `~${eq}% equity vs random hand`
  }
  if (isSuited) {
    return 'Suited: +2–3% equity from flush potential'
  }
  return 'Offsuit: standard equity, no flush draw'
}

const COACH_QUOTES = {
  AA: "Pocket Rockets. Always raise, never slow-play preflop. Extract maximum value.",
  KK: "Cowboys. Raise pre. Be ready to commit postflop even on ace-high boards.",
  QQ: "Ladies. Strong open from any position. Be cautious vs aggression on K/A flops.",
  JJ: "Hooks. Solid opener. Prepare for difficult spots vs overcards postflop.",
  TT: "Tens. Good open from all positions, but be selective about how deep you commit.",
  AKs: "The 'Big Slick' suited — one of the most powerful hands. Always raise.",
  AKo: "AKo: standard open from any position, play for stacks preflop in 3-bet pots.",
  AQs: "AQs is a 3-bet or open. Avoid calling 3-bets vs UTG (dominated risk).",
  AQo: "AQo: strong open but be wary of AK when facing 3-bets from early positions.",
  default: "GTO strategy: follow the range. Deviate only with strong reads on your opponent.",
}

export default function HandDetailPanel({ hand, rangeData, position, situation, gameType, stackDepth }) {
  if (!hand) {
    return (
      <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center min-h-[280px] text-center">
        <div className="text-4xl mb-3 opacity-30">🃏</div>
        <p className="text-cream-muted text-sm font-body">
          Click any cell in the matrix to see hand details
        </p>
        <p className="text-cream-muted/50 text-xs mt-2">
          Hover for quick info
        </p>
      </div>
    )
  }

  const data = rangeData?.[hand] || { action: 'fold', frequency: 0 }
  const { action, frequency } = data
  const color = ACTION_COLORS[action] || '#888'
  const label = ACTION_LABELS[action] || 'Unknown'
  const combos = getCombos(hand)
  const name = getHandName(hand)
  const pct = Math.round((frequency || 0) * 100)
  const quote = COACH_QUOTES[hand] || COACH_QUOTES.default
  const situationLabel = SITUATION_LABELS[situation] || situation

  let actionDetail = ''
  if (action === 'raise') actionDetail = '100% — Always raise'
  else if (action === 'call') actionDetail = '100% — Always call'
  else if (action === 'fold') actionDetail = '0% — Fold'
  else if (action === 'mixed_rf') actionDetail = `Raise ${pct}% / Fold ${100 - pct}%`
  else if (action === 'mixed_rc') actionDetail = `Raise ${pct}% / Call ${100 - pct}%`

  return (
    <motion.div
      className="glass-panel rounded-2xl p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Hand title */}
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-bold text-cream tracking-wide">
          {hand}
        </h3>
        <p className="text-xs text-cream-dim mt-0.5">{name}</p>
      </div>

      {/* Card visual */}
      <HandCards hand={hand} />

      {/* Context pills */}
      <div className="flex gap-1.5 justify-center mb-4 flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs text-gold font-semibold border border-gold/20">
          {position}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs text-cream-dim border border-gold/10">
          {situationLabel}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs text-cream-dim border border-gold/10">
          {gameType === 'cash' ? 'Cash' : 'MTT'} {stackDepth}
        </span>
      </div>

      {/* Action recommendation */}
      <div
        className="rounded-xl p-3 mb-4 border"
        style={{
          background: color + '18',
          borderColor: color + '40',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ background: color }}
          />
          <span className="font-semibold text-sm" style={{ color }}>
            {label}
          </span>
        </div>
        <div className="text-xs text-cream-dim mb-2">{actionDetail}</div>
        <FrequencyBar action={action} frequency={frequency} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-surface-2 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-cream font-display">{combos}</div>
          <div className="text-[10px] text-cream-muted">combos</div>
        </div>
        <div className="bg-surface-2 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold font-display" style={{ color }}>
            {action === 'fold' ? '—' : `${pct || 100}%`}
          </div>
          <div className="text-[10px] text-cream-muted">frequency</div>
        </div>
      </div>

      {/* Equity note */}
      <div className="bg-surface-2 rounded-lg p-2.5 mb-4">
        <div className="text-[10px] text-cream-muted uppercase tracking-wider mb-1 font-semibold">
          Equity Note
        </div>
        <div className="text-xs text-cream-dim">{getEquityNote(hand)}</div>
      </div>

      {/* Coach quote */}
      <div className="border-l-2 border-gold/40 pl-3">
        <p className="text-xs text-cream-dim italic leading-relaxed">
          "{quote}"
        </p>
        <p className="text-[10px] text-gold/60 mt-1 font-semibold">
          — GTO Wizard 6-max NLHE
        </p>
      </div>
    </motion.div>
  )
}
