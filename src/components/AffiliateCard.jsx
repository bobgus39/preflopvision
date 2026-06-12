import { motion } from 'framer-motion'
import { trackAffiliateClick } from '../affiliate/tracking'

// Reusable room card — used in /play page and anywhere inline
// Props: room (from affiliate/data.js), source (tracking string), compact (boolean)
export default function AffiliateCard({ room, source = 'sidebar', compact = false }) {
  const handleClick = () => trackAffiliateClick(room.id, source, room.affiliateUrl)

  if (compact) {
    return (
      <motion.div
        className="rounded-xl p-4 border flex items-center gap-4"
        style={{ background: room.colorBg, borderColor: room.colorBorder }}
        whileHover={{ scale: 1.01, boxShadow: `0 0 20px ${room.colorBg}` }}
        transition={{ duration: 0.15 }}
      >
        {/* Room name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-display font-bold text-sm" style={{ color: room.color }}>
              {room.name}
            </span>
            {room.badge && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-bg"
                style={{ background: room.badgeColor || room.color }}
              >
                {room.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gold font-semibold truncate">{room.bonus}</p>
        </div>
        <motion.button
          onClick={handleClick}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold font-display text-bg"
          style={{ background: room.color }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {room.cta} →
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="rounded-2xl p-6 border flex flex-col h-full relative overflow-hidden"
      style={{
        background: room.featured
          ? `linear-gradient(145deg, ${room.colorBg} 0%, rgba(14,14,22,0.9) 60%)`
          : room.colorBg,
        borderColor: room.featured ? room.colorBorder : 'rgba(255,255,255,0.07)',
        borderWidth: room.featured ? '1.5px' : '1px',
      }}
      whileHover={{ boxShadow: `0 0 32px ${room.colorBg}`, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Badge */}
      {room.badge && (
        <div className="absolute top-4 right-4">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-bg uppercase tracking-wide"
            style={{ background: room.badgeColor || room.color }}
          >
            {room.badge}
          </span>
        </div>
      )}

      {/* Room name */}
      <div className="mb-4">
        <h3
          className="font-display text-xl font-bold mb-1"
          style={{ color: room.color }}
        >
          {room.name}
        </h3>
        <p className="text-xs text-cream-muted leading-snug">{room.tagline}</p>
      </div>

      {/* Bonus highlight */}
      <div
        className="rounded-xl px-4 py-3 mb-4 border"
        style={{ background: 'rgba(0,0,0,0.25)', borderColor: room.colorBorder }}
      >
        <p className="text-sm font-bold font-display" style={{ color: room.color }}>
          {room.bonus}
        </p>
        <p className="text-[11px] text-cream-muted mt-0.5">{room.bonusDetail}</p>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-4">
        <StatChip label="Software" value={'★'.repeat(room.stats.software) + '☆'.repeat(5 - room.stats.software)} />
        <StatChip label="Tráfico"  value={'★'.repeat(room.stats.traffic)  + '☆'.repeat(5 - room.stats.traffic)} />
        <StatChip label="Rake"     value={room.stats.rakePct} />
      </div>

      {/* Pros */}
      <ul className="flex-1 space-y-1.5 mb-5">
        {room.pros.slice(0, 3).map((pro, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-cream-dim">
            <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: room.color }}>✓</span>
            {pro}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <motion.button
        onClick={handleClick}
        className="w-full py-3 rounded-xl font-bold font-display tracking-wide text-sm"
        style={{
          background: room.featured
            ? `linear-gradient(135deg, ${room.color}, ${room.color}aa)`
            : room.color,
          color: '#0D0D12',
        }}
        whileHover={{ scale: 1.02, boxShadow: `0 4px 20px ${room.colorBg}` }}
        whileTap={{ scale: 0.98 }}
      >
        {room.cta} →
      </motion.button>

      <p className="text-[10px] text-cream-muted/40 text-center mt-2">
        Enlace de afiliado · Juego responsable +18
      </p>
    </motion.div>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="flex-1 text-center glass-panel rounded-lg py-2 px-1">
      <div className="text-[9px] text-cream-muted mb-0.5 uppercase tracking-wide">{label}</div>
      <div className="text-[10px] font-bold text-cream-dim font-mono leading-none">{value}</div>
    </div>
  )
}
