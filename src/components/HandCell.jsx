import { useState, useRef, useCallback } from 'react'
import { getHandName, getCombos, ACTION_LABELS, ACTION_COLORS } from '../data/ranges'

function getActionStyle(action, frequency) {
  const base = ACTION_COLORS[action] || ACTION_COLORS.fold
  if (!action || action === 'fold') {
    return { background: '#1E1E2C' }
  }
  if (action === 'raise' || action === 'call') {
    return { background: base }
  }
  if (action === 'mixed_rf') {
    const pct = Math.round(frequency * 100)
    return {
      background: `linear-gradient(to bottom, ${ACTION_COLORS.raise} 0%, ${ACTION_COLORS.raise} ${pct}%, #1E1E2C ${pct}%, #1E1E2C 100%)`
    }
  }
  if (action === 'mixed_rc') {
    const pct = Math.round(frequency * 100)
    return {
      background: `linear-gradient(to bottom, ${ACTION_COLORS.raise} 0%, ${ACTION_COLORS.raise} ${pct}%, ${ACTION_COLORS.call} ${pct}%, ${ACTION_COLORS.call} 100%)`
    }
  }
  return { background: base }
}

function Tooltip({ hand, action, frequency, visible, x, y }) {
  if (!visible) return null

  const pct = Math.round((frequency || 0) * 100)
  const combos = getCombos(hand)
  const actionLabel = ACTION_LABELS[action] || action
  const color = ACTION_COLORS[action] || '#888'

  let freqText = ''
  if (action === 'raise') freqText = 'Always raise'
  else if (action === 'call') freqText = 'Always call'
  else if (action === 'fold') freqText = 'Fold'
  else if (action === 'mixed_rf') freqText = `Raise ${pct}% / Fold ${100 - pct}%`
  else if (action === 'mixed_rc') freqText = `Raise ${pct}% / Call ${100 - pct}%`

  return (
    <div
      className="tooltip"
      style={{
        left: x + 12,
        top: y - 10,
        transform: x > window.innerWidth - 240 ? 'translateX(-105%)' : undefined,
      }}
    >
      <div className="font-display text-sm font-semibold text-cream mb-1">
        {hand}
      </div>
      <div className="text-xs text-cream-dim mb-1.5 leading-snug">
        {getHandName(hand)}
      </div>
      <div
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md mb-1.5"
        style={{ background: color + '30', color }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
        {actionLabel}
      </div>
      {freqText && (
        <div className="text-xs text-cream-dim">{freqText}</div>
      )}
      <div className="text-xs text-cream-muted mt-1">
        {combos} combo{combos !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default function HandCell({ hand, action, frequency, isSelected, onClick }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 })
  const cellRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    setTooltip({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }))
  }, [])

  const style = getActionStyle(action, frequency)

  // Show hand label: shorter for offsuit/suited
  const label = hand.length === 2
    ? hand
    : hand.slice(0, 2) + hand.slice(2)

  return (
    <>
      <div
        ref={cellRef}
        className={`matrix-cell${isSelected ? ' selected' : ''}`}
        style={{
          ...style,
          borderRadius: 3,
          aspectRatio: '1',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        title=""
      >
        <span
          className="leading-none pointer-events-none"
          style={{
            color: action === 'fold' ? 'rgba(160,152,120,0.35)' : 'rgba(255,255,255,0.85)',
            fontSize: 'clamp(7px, 1vw, 10px)',
            fontWeight: 700,
            textShadow: action !== 'fold' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
          }}
        >
          {label}
        </span>
      </div>

      <Tooltip
        hand={hand}
        action={action}
        frequency={frequency}
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
      />
    </>
  )
}
