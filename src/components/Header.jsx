import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const STACK_DEPTHS = ['100bb', '50bb', '25bb']

export default function Header({ gameType, setGameType, stackDepth, setStackDepth, quizMode, setQuizMode, onOpenPdfExport }) {
  const { user, isPro, openPricing, openLogin, logout, isLocked } = useAuth()

  function handleStackDepth(depth) {
    // MTT 50bb/25bb is Pro-only
    if (gameType === 'mtt' && depth !== '100bb' && !isPro()) {
      openPricing('mtt_shallow')
      return
    }
    setStackDepth(depth)
  }

  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-gold/15 shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-[60px] flex items-center gap-3">

        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 mr-1 flex-shrink-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-2xl">🃏</span>
          <div className="leading-none">
            <span className="font-display text-base font-bold gold-text tracking-wider hidden sm:block">
              PREFLOP VISION
            </span>
            <span className="font-display text-base font-bold gold-text tracking-wider sm:hidden">PV</span>
            <div className="text-[9px] text-cream-muted tracking-[0.2em] uppercase hidden sm:block">
              GTO Reference Tool
            </div>
          </div>
        </motion.div>

        <div className="flex-1" />

        {/* Game type */}
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-gold/10">
          {['cash', 'mtt'].map(type => (
            <button
              key={type}
              onClick={() => setGameType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                gameType === type
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'text-cream-dim hover:text-cream'
              }`}
            >
              {type === 'cash' ? 'Cash' : 'MTT'}
            </button>
          ))}
        </div>

        {/* Stack depth */}
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-gold/10">
          {STACK_DEPTHS.map(depth => {
            const locked = gameType === 'mtt' && depth !== '100bb' && !isPro()
            return (
              <button
                key={depth}
                onClick={() => handleStackDepth(depth)}
                className={`relative px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  stackDepth === depth && !locked
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : locked
                      ? 'text-cream-muted/40 cursor-pointer'
                      : 'text-cream-dim hover:text-cream'
                }`}
                title={locked ? 'Requiere Plan Pro' : depth}
              >
                {locked && (
                  <span className="absolute -top-1 -right-1 text-[8px]">🔒</span>
                )}
                {depth}
              </button>
            )
          })}
        </div>

        {/* PDF export — Pro only */}
        {isPro() && !quizMode && onOpenPdfExport && (
          <motion.button
            onClick={onOpenPdfExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gold/15 bg-surface text-cream-dim hover:border-gold/35 hover:text-cream transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Exportar rangos en PDF"
          >
            <span className="hidden sm:inline">⬇</span>
            <span className="hidden sm:inline">PDF</span>
            <span className="sm:hidden">⬇ PDF</span>
          </motion.button>
        )}

        {/* Quiz toggle */}
        <motion.button
          onClick={() => setQuizMode(!quizMode)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
            quizMode
              ? 'bg-success/20 border-success/50 text-success'
              : 'bg-surface border-gold/20 text-cream-dim hover:border-gold/40 hover:text-cream'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{quizMode ? '⊙' : '◎'}</span>
          <span className="hidden sm:inline">{quizMode ? 'Reference' : 'Quiz'}</span>
        </motion.button>

        {/* Plan badge / auth controls */}
        {isPro() ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5"
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold font-display tracking-wider"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.08) 100%)',
                borderColor: 'rgba(201,168,76,0.5)',
                color: '#E8C76B',
              }}
            >
              <span>PRO</span>
              <span className="text-gold/70">✦</span>
            </div>
            <button
              onClick={logout}
              className="text-[10px] text-cream-muted hover:text-cream transition-colors px-1"
              title="Cerrar sesión"
            >
              ⊗
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1.5">
            <motion.button
              onClick={openLogin}
              className="hidden sm:flex items-center px-2.5 py-2 rounded-lg text-xs font-semibold border border-gold/15 bg-surface text-cream-dim hover:text-cream hover:border-gold/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Iniciar sesión"
            >
              Acceder
            </motion.button>
            <motion.button
              onClick={() => openPricing()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Actualizar a Plan Pro"
            >
              <span className="text-[10px] text-cream-muted font-normal hidden sm:inline border border-gold/15 px-1.5 py-0.5 rounded bg-surface">
                FREE
              </span>
              <span className="hidden sm:inline">→ Pro</span>
              <span className="sm:hidden">Pro ✦</span>
            </motion.button>
          </div>
        )}
      </div>
    </header>
  )
}
