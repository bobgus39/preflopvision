import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROOMS, stars } from '../affiliate/data'
import { trackAffiliateClick } from '../affiliate/tracking'
import AffiliateCard from '../components/AffiliateCard'

// ─── Comparison table ─────────────────────────────────────────────────────────

const TABLE_ROWS = [
  { label: 'Bono bienvenida',  key: r => r.stats.bonusAmount },
  { label: 'Software',         key: r => stars(r.stats.software) },
  { label: 'Tráfico',          key: r => stars(r.stats.traffic) },
  { label: 'Rake',             key: r => r.stats.rakePct },
  { label: 'Mejor para',       key: r => r.bestFor },
]

function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gold/10">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(201,168,76,0.06)', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
            <th className="text-left px-5 py-3 text-cream-muted text-xs font-display uppercase tracking-wider w-36">
              Criterio
            </th>
            {ROOMS.map(room => (
              <th key={room.id} className="px-5 py-3 text-center">
                <span className="font-display font-bold text-sm" style={{ color: room.color }}>
                  {room.name}
                </span>
                {room.featured && (
                  <span
                    className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-bg"
                    style={{ background: room.badgeColor || room.color }}
                  >
                    ✦
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <td className="px-5 py-3 text-xs text-cream-muted font-semibold">{row.label}</td>
              {ROOMS.map(room => (
                <td key={room.id} className="px-5 py-3 text-center text-xs text-cream-dim font-mono">
                  {row.key(room)}
                </td>
              ))}
            </tr>
          ))}

          {/* Pros */}
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
            <td className="px-5 py-3 text-xs text-cream-muted font-semibold align-top">Pros</td>
            {ROOMS.map(room => (
              <td key={room.id} className="px-5 py-3 align-top">
                <ul className="space-y-1">
                  {room.pros.slice(0, 3).map((p, j) => (
                    <li key={j} className="text-xs text-cream-dim flex items-start gap-1">
                      <span className="flex-shrink-0" style={{ color: room.color }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          {/* Cons */}
          <tr>
            <td className="px-5 py-3 text-xs text-cream-muted font-semibold align-top">Contras</td>
            {ROOMS.map(room => (
              <td key={room.id} className="px-5 py-3 align-top">
                <ul className="space-y-1">
                  {room.cons.map((c, j) => (
                    <li key={j} className="text-xs text-cream-dim flex items-start gap-1">
                      <span className="text-cream-muted/40 flex-shrink-0">·</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── FAQ / disclaimer ─────────────────────────────────────────────────────────

const NOTES = [
  '💡 Los bonos pueden cambiar. Comprueba las condiciones actuales en cada sala antes de registrarte.',
  '⚠️ Juego responsable — solo para mayores de 18 años. Si el juego supone un problema, visita jugarbien.es.',
  '🔗 Los enlaces a las salas son de afiliado. Preflop Vision recibe una comisión si te registras desde aquí, sin coste adicional para ti.',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg text-cream font-body">
      <div className="hero-glow" />

      {/* Header */}
      <header className="relative z-10 border-b border-gold/10 h-[60px] flex items-center px-6 gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <span className="text-2xl">🃏</span>
          <span className="font-display font-bold text-sm gold-text tracking-wider group-hover:opacity-80 transition-opacity">
            PREFLOP VISION
          </span>
        </button>

        <div className="flex-1" />

        <button
          onClick={() => navigate('/')}
          className="text-xs text-cream-muted hover:text-cream border border-gold/15 hover:border-gold/30 px-3 py-1.5 rounded-lg transition-all"
        >
          ← Volver a la app
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-14 sm:py-20">

        {/* ── Hero ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-gold/70 text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            Mesa real
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-cream mb-4 leading-tight">
            ¿Listo para aplicarlo<br className="hidden sm:block" /> en mesa real?
          </h1>
          <p className="text-cream-dim text-lg max-w-xl mx-auto mb-6">
            Entrenas el preflop GTO aquí. El siguiente paso es llevarlo a una mesa real,
            con dinero real y rivales reales.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-cream-muted/60">
            <span>✓ Rangos GTO que practicas aquí</span>
            <span>✓ Salas verificadas</span>
            <span>✓ Bonos exclusivos</span>
          </div>
        </motion.div>

        {/* ── Room cards ── */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <h2 className="font-display text-xl font-bold text-cream mb-6">
            Salas recomendadas
          </h2>

          {/* Featured room full-width on top */}
          {ROOMS.filter(r => r.featured).map(room => (
            <div key={room.id} className="mb-4">
              <AffiliateCard room={room} source="play_page" />
            </div>
          ))}

          {/* Other rooms side-by-side */}
          <div className="grid sm:grid-cols-2 gap-4">
            {ROOMS.filter(r => !r.featured).map(room => (
              <AffiliateCard key={room.id} room={room} source="play_page" />
            ))}
          </div>
        </motion.section>

        {/* ── Comparison table ── */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="font-display text-xl font-bold text-cream mb-4">
            Comparativa de salas
          </h2>
          <ComparisonTable />
        </motion.section>

        {/* ── Big CTAs ── */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h2 className="font-display text-xl font-bold text-cream mb-6">
            Empezar en 3 pasos
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { n: '1', title: 'Elige sala', desc: 'Compara el bono y el software. GGPoker para experiencia completa, 888poker si prefieres empezar gratis.' },
              { n: '2', title: 'Regístrate',  desc: 'Usa uno de los enlaces de arriba para activar el bono de bienvenida y comenzar con ventaja.' },
              { n: '3', title: 'Aplica el GTO', desc: 'Usa los rangos de Preflop Vision como referencia mientras juegas. Enfócate primero en las aperturas.' },
            ].map(step => (
              <div key={step.n} className="glass-panel rounded-xl p-5">
                <div className="font-display text-3xl font-bold text-gold/30 mb-2">{step.n}</div>
                <h3 className="font-display font-bold text-cream text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-cream-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Large CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {ROOMS.map(room => (
              <motion.button
                key={room.id}
                onClick={() => trackAffiliateClick(room.id, 'play_page', room.affiliateUrl)}
                className="flex-1 py-3.5 rounded-xl font-bold font-display tracking-wide text-sm text-bg"
                style={{ background: room.color, maxWidth: 240 }}
                whileHover={{ scale: 1.02, boxShadow: `0 4px 20px ${room.colorBg}` }}
                whileTap={{ scale: 0.98 }}
              >
                {room.cta} →
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── Legal notes ── */}
        <div className="space-y-2">
          {NOTES.map((note, i) => (
            <p key={i} className="text-[11px] text-cream-muted/50 leading-relaxed">
              {note}
            </p>
          ))}
        </div>
      </main>
    </div>
  )
}
