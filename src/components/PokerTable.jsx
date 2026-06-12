import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const SEAT_POSITIONS = {
  UTG: { cx: 82,  cy: 162, label: 'UTG' },
  HJ:  { cx: 175, cy: 52,  label: 'HJ'  },
  CO:  { cx: 325, cy: 52,  label: 'CO'  },
  BTN: { cx: 418, cy: 162, label: 'BTN' },
  SB:  { cx: 325, cy: 272, label: 'SB'  },
  BB:  { cx: 175, cy: 272, label: 'BB'  },
}

const POSITION_DESCRIPTIONS = {
  UTG: 'Under the Gun',
  HJ:  'Hijack',
  CO:  'Cutoff',
  BTN: 'Button',
  SB:  'Small Blind',
  BB:  'Big Blind',
}

const DEALER_BUTTON_POS = { cx: 370, cy: 200 }

export default function PokerTable({ position, onSelectPosition }) {
  const { isLocked, openPricing } = useAuth()

  function handleSeatClick(pos) {
    const feature = `pos:${pos}`
    if (isLocked(feature)) {
      openPricing(feature)
      return
    }
    onSelectPosition(pos)
  }

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="text-center mb-3">
        <h2 className="font-display text-sm font-semibold text-gold tracking-widest uppercase">
          Select Position
        </h2>
        <p className="text-xs text-cream-muted mt-0.5">
          {POSITION_DESCRIPTIONS[position]}
        </p>
      </div>

      <div className="relative">
        <svg viewBox="0 0 500 320" className="w-full" style={{ maxHeight: 220 }}>
          {/* Table shadow */}
          <ellipse cx="250" cy="162" rx="195" ry="118" fill="rgba(0,0,0,0.4)" transform="translate(4,6)" />

          {/* Table border */}
          <ellipse cx="250" cy="162" rx="195" ry="118" fill="none" stroke="#5D4A1E" strokeWidth="14" />
          <ellipse cx="250" cy="162" rx="195" ry="118" fill="none" stroke="#C9A84C" strokeWidth="2" opacity="0.6" />

          {/* Felt */}
          <ellipse cx="250" cy="162" rx="186" ry="109" fill="url(#feltGradient)" />
          <ellipse cx="250" cy="162" rx="186" ry="109" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <ellipse cx="250" cy="162" rx="145" ry="84"  fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Logo */}
          <text x="250" y="156" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11"
            fill="rgba(201,168,76,0.25)" fontWeight="700" letterSpacing="3">PREFLOP</text>
          <text x="250" y="172" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11"
            fill="rgba(201,168,76,0.25)" fontWeight="700" letterSpacing="3">VISION</text>

          {/* Dealer button */}
          <circle cx={DEALER_BUTTON_POS.cx} cy={DEALER_BUTTON_POS.cy} r="9"
            fill="#F0EAD6" stroke="#C9A84C" strokeWidth="1.5" opacity="0.7" />
          <text x={DEALER_BUTTON_POS.cx} y={DEALER_BUTTON_POS.cy + 4}
            textAnchor="middle" fontSize="8" fontWeight="700" fill="#0D0D12" fontFamily="Inter, sans-serif">D</text>

          <defs>
            <radialGradient id="feltGradient" cx="50%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="#1B5E3A" />
              <stop offset="50%"  stopColor="#145232" />
              <stop offset="100%" stopColor="#0A3020" />
            </radialGradient>
          </defs>

          {/* Seats */}
          {Object.entries(SEAT_POSITIONS).map(([pos, { cx, cy, label }]) => {
            const isActive = pos === position
            const locked   = isLocked(`pos:${pos}`)

            return (
              <g key={pos} onClick={() => handleSeatClick(pos)} style={{ cursor: 'pointer' }}>
                {isActive && !locked && (
                  <circle cx={cx} cy={cy} r="26"
                    fill="rgba(201,168,76,0.12)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" />
                )}
                <circle
                  cx={cx} cy={cy} r="20"
                  fill={
                    locked   ? 'rgba(18,18,28,0.92)' :
                    isActive ? 'rgba(201,168,76,0.2)' :
                               'rgba(26,26,36,0.9)'
                  }
                  stroke={
                    locked   ? 'rgba(231,76,60,0.2)' :
                    isActive ? '#C9A84C' :
                               'rgba(201,168,76,0.25)'
                  }
                  strokeWidth={isActive && !locked ? '2' : '1.5'}
                />
                <text x={cx} y={cy + 4} textAnchor="middle"
                  fontFamily="Cinzel, serif" fontSize="9" fontWeight="700" letterSpacing="0.5"
                  fill={locked ? '#504540' : isActive ? '#E8C76B' : '#A09878'}
                >
                  {label}
                </text>
                {/* Lock icon for Pro-only seats */}
                {locked && (
                  <text x={cx + 11} y={cy - 11} fontSize="9" textAnchor="middle" fill="#C9A84C" opacity="0.7">
                    🔒
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Position quick-select pills */}
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {Object.keys(SEAT_POSITIONS).map(pos => {
          const locked = isLocked(`pos:${pos}`)
          return (
            <motion.button
              key={pos}
              onClick={() => handleSeatClick(pos)}
              className={`py-1.5 rounded-lg text-xs font-bold font-display tracking-wide transition-all relative ${
                pos === position && !locked
                  ? 'bg-gold/20 border border-gold/50 text-gold'
                  : locked
                    ? 'bg-surface-2 border border-gold/5 text-cream-muted/30 cursor-pointer'
                    : 'bg-surface-2 border border-gold/10 text-cream-dim hover:border-gold/30 hover:text-cream'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title={locked ? `${pos} — Plan Pro` : pos}
            >
              {locked && (
                <span className="absolute top-0.5 right-1 text-[8px] opacity-60">🔒</span>
              )}
              {pos}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
