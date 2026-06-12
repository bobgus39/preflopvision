import { motion } from 'framer-motion'
import { SITUATIONS_BY_POSITION, SITUATION_LABELS } from '../data/ranges'
import { useAuth } from '../context/AuthContext'

export default function SituationTabs({ position, situation, onChange }) {
  const { isLocked, openPricing } = useAuth()
  const situations = SITUATIONS_BY_POSITION[position] || ['RFI']

  function handleClick(sit) {
    const feature = `sit:${position}:${sit}`
    if (isLocked(feature)) {
      openPricing(feature)
      return
    }
    onChange(sit)
  }

  return (
    <div className="mt-3 glass-panel rounded-xl p-3">
      <div className="text-xs text-cream-muted font-semibold uppercase tracking-widest mb-2 px-1">
        Situation
      </div>
      <div className="flex flex-wrap gap-1.5">
        {situations.map(sit => {
          const feature = `sit:${position}:${sit}`
          const locked  = isLocked(feature)

          return (
            <motion.button
              key={sit}
              onClick={() => handleClick(sit)}
              className={`tab-pill relative ${situation === sit && !locked ? 'active' : ''} ${locked ? 'opacity-50' : ''}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title={locked ? 'Requiere Plan Pro' : undefined}
            >
              {locked && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none">🔒</span>
              )}
              {SITUATION_LABELS[sit] || sit}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
