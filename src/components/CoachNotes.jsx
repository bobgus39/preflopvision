import { motion } from 'framer-motion'
import { coachNotes, generalTips } from '../data/coachNotes'

export default function CoachNotes({ gameType, position }) {
  const positionNotes = coachNotes[gameType]?.[position] || coachNotes.cash[position] || []
  const allNotes = [...positionNotes, ...generalTips].slice(0, 4)

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-gold text-sm">◆</span>
        <h3 className="font-display text-sm font-semibold text-gold tracking-wider uppercase">
          Coach Notes — {position}
        </h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {allNotes.map((note, i) => (
          <motion.div
            key={i}
            className="glass-panel rounded-xl p-3.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
          >
            <p className="text-xs text-cream-dim leading-relaxed italic">
              "{note.tip}"
            </p>
            <p className="text-[10px] text-gold/55 mt-2 font-semibold">
              {note.source}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
