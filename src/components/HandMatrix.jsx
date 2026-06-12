import { useMemo } from 'react'
import { motion } from 'framer-motion'
import HandCell from './HandCell'
import { RANKS, getHandKey, ACTION_COLORS, ACTION_LABELS, getAllHands } from '../data/ranges'

function RangeSummary({ rangeData }) {
  const stats = useMemo(() => {
    if (!rangeData) return null
    const all = getAllHands()
    const counts = { raise: 0, call: 0, mixed_rf: 0, mixed_rc: 0, fold: 0 }
    let totalCombos = 0
    let playableCombos = 0

    all.forEach(hand => {
      const d = rangeData[hand]
      if (!d) return
      const isPair = hand.length === 2
      const isSuited = hand.endsWith('s')
      const combos = isPair ? 6 : isSuited ? 4 : 12
      totalCombos += combos

      if (d.action !== 'fold') {
        counts[d.action] = (counts[d.action] || 0) + 1
        const freqCombos = combos * (d.frequency || 1)
        playableCombos += freqCombos
      } else {
        counts.fold++
      }
    })

    return {
      counts,
      pct: ((playableCombos / totalCombos) * 100).toFixed(1),
    }
  }, [rangeData])

  if (!stats) return null

  const items = [
    { key: 'raise', label: 'Raise' },
    { key: 'call', label: 'Call' },
    { key: 'mixed_rf', label: 'Mixed R/F' },
    { key: 'mixed_rc', label: 'Mixed R/C' },
  ].filter(i => stats.counts[i.key] > 0)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 px-1">
      <span className="text-xs font-semibold text-cream">
        <span className="text-gold font-display text-sm">{stats.pct}%</span>
        <span className="text-cream-muted ml-1 text-[11px]">of hands</span>
      </span>
      {items.map(({ key, label }) => (
        <span key={key} className="flex items-center gap-1 text-[10px] text-cream-dim">
          <span
            className="legend-dot"
            style={{ background: ACTION_COLORS[key] }}
          />
          {label} ({stats.counts[key]})
        </span>
      ))}
    </div>
  )
}

export default function HandMatrix({ rangeData, selectedHand, onSelectHand }) {
  if (!rangeData) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-cream-muted text-sm">No range data for this scenario.</p>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-3 sm:p-4">
      {/* Axis labels row */}
      <div className="flex items-center gap-1 mb-1">
        <div style={{ width: 18, flexShrink: 0 }} /> {/* offset for row labels */}
        {RANKS.map(r => (
          <div
            key={r}
            className="flex-1 text-center text-[9px] font-bold text-cream-muted font-display"
            style={{ minWidth: 0 }}
          >
            {r}
          </div>
        ))}
      </div>

      <RangeSummary rangeData={rangeData} />

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2.5 px-0.5">
        {[
          { key: 'raise', label: 'Raise' },
          { key: 'call', label: 'Call' },
          { key: 'mixed_rf', label: 'Mixed R/F' },
          { key: 'mixed_rc', label: 'Mixed R/C' },
          { key: 'fold', label: 'Fold' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="legend-dot"
              style={{
                background: key === 'mixed_rf'
                  ? `linear-gradient(to bottom, ${ACTION_COLORS.raise} 0%, ${ACTION_COLORS.raise} 50%, #1E1E2C 50%, #1E1E2C 100%)`
                  : ACTION_COLORS[key],
              }}
            />
            <span className="text-[9px] text-cream-muted">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <div style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid #E8C76B', background: 'transparent', flexShrink: 0 }} />
          <span className="text-[9px] text-cream-muted">Suited ▲</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid rgba(160,152,120,0.3)', background: 'transparent', flexShrink: 0 }} />
          <span className="text-[9px] text-cream-muted">Offsuit ▽</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-0.5">
        {/* Row labels */}
        <div className="flex flex-col gap-0.5" style={{ width: 18, flexShrink: 0 }}>
          <div style={{ height: 0 }} /> {/* spacer for axis labels row */}
          {RANKS.map(r => (
            <div
              key={r}
              className="flex items-center justify-center text-[9px] font-bold text-cream-muted font-display flex-1"
              style={{ minHeight: 0, aspectRatio: '1' }}
            >
              {r}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="flex-1 min-w-0">
          {/* Column header spacer */}
          <div style={{ height: 0 }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(13, 1fr)`,
              gap: '2px',
            }}
          >
            {RANKS.map((rowRank, row) =>
              RANKS.map((colRank, col) => {
                const hand = getHandKey(row, col)
                const data = rangeData[hand] || { action: 'fold', frequency: 0 }
                const isSuited = row < col
                const isPair = row === col

                return (
                  <div
                    key={`${row}-${col}`}
                    style={{
                      outline: isSuited ? '1px solid rgba(232,199,107,0.3)' : isPair ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(160,152,120,0.1)',
                      borderRadius: 3,
                    }}
                  >
                    <HandCell
                      hand={hand}
                      action={data.action}
                      frequency={data.frequency}
                      isSelected={hand === selectedHand}
                      onClick={() => onSelectHand(hand)}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Suited/Offsuit hint */}
      <div className="flex justify-between mt-2 px-5">
        <span className="text-[9px] text-cream-muted/60 italic">← Offsuit (lower left)</span>
        <span className="text-[9px] text-gold/50 italic">Suited (upper right) →</span>
      </div>
    </div>
  )
}
