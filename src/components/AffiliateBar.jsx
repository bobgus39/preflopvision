import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROOMS } from '../affiliate/data'
import { trackAffiliateClick, isBarDismissed, dismissBar } from '../affiliate/tracking'

// Fixed 48px bottom bar — desktop only, dismissible for 7 days
// Placement rule: only renders outside quiz mode (passed quizMode prop)
export default function AffiliateBar({ quizMode = false }) {
  const navigate = useNavigate()
  const [closed, setClosed] = useState(() => isBarDismissed())

  // Never show in quiz mode or when dismissed
  if (quizMode || closed) return null

  const handleDismiss = () => {
    dismissBar()
    setClosed(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="hidden lg:flex fixed bottom-0 inset-x-0 z-40 items-center px-5 gap-4"
        style={{
          height: 48,
          background: '#1A1A24',
          borderTop: '1px solid rgba(201,168,76,0.18)',
        }}
        initial={{ y: 64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 64, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 1.5 }}
      >
        {/* Left: prompt text + play page link */}
        <button
          onClick={() => navigate('/play')}
          className="text-xs text-cream-muted hover:text-cream transition-colors whitespace-nowrap flex items-center gap-1.5 group"
        >
          <span className="text-gold/60 group-hover:text-gold transition-colors">♠</span>
          Practica lo que aprendes aquí
          <span className="text-cream-muted/50 group-hover:text-gold/60 transition-colors">→</span>
        </button>

        <div className="w-px h-5 bg-gold/10 flex-shrink-0" />

        {/* Room quick-links */}
        <div className="flex items-center gap-2 flex-1">
          {ROOMS.map(room => (
            <motion.button
              key={room.id}
              onClick={() => trackAffiliateClick(room.id, 'bottom_bar', room.affiliateUrl)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all"
              style={{
                background: 'transparent',
                borderColor: room.colorBorder,
                color: room.color,
              }}
              whileHover={{
                background: room.colorBg,
                scale: 1.02,
              }}
              whileTap={{ scale: 0.97 }}
            >
              {room.name}
              {room.badge && (
                <span
                  className="text-[8px] font-bold px-1 py-0.5 rounded-full text-bg leading-none"
                  style={{ background: room.badgeColor || room.color }}
                >
                  {room.badge}
                </span>
              )}
            </motion.button>
          ))}

          <button
            onClick={() => navigate('/play')}
            className="ml-1 text-[11px] text-cream-muted/50 hover:text-cream-muted transition-colors underline underline-offset-2"
          >
            Ver comparativa →
          </button>
        </div>

        {/* Disclaimer */}
        <span className="text-[9px] text-cream-muted/30 whitespace-nowrap hidden xl:block">
          +18 · Juego responsable
        </span>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-2 text-cream-muted/50 hover:text-cream-muted transition-all text-base flex-shrink-0"
          aria-label="Cerrar"
          title="Ocultar 7 días"
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
