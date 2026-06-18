import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import PokerTable from './components/PokerTable'
import HandMatrix from './components/HandMatrix'
import SituationTabs from './components/SituationTabs'
import HandDetailPanel from './components/HandDetailPanel'
import CoachNotes from './components/CoachNotes'
import QuizMode from './components/QuizMode'
import ProGate from './components/ProGate'
import PricingModal from './components/PricingModal'
import AffiliateBar from './components/AffiliateBar'
import PdfExportModal from './components/PdfExportModal'
import LoginModal from './components/LoginModal'
import { ranges, SITUATIONS_BY_POSITION } from './data/ranges'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { isLocked } = useAuth()
  const navigate = useNavigate()

  const [gameType,   setGameType]   = useState('cash')
  const [stackDepth, setStackDepth] = useState('100bb')
  const [position,   setPosition]   = useState('BTN')
  const [situation,  setSituation]  = useState('RFI')
  const [selectedHand, setSelectedHand] = useState(null)
  const [quizMode,      setQuizMode]      = useState(false)
  const [mobileTab,     setMobileTab]     = useState('table')
  const [showPdfExport, setShowPdfExport] = useState(false)

  const handlePositionChange = useCallback((pos) => {
    // Already gated in PokerTable — but guard here too
    if (isLocked(`pos:${pos}`)) return
    setPosition(pos)
    setSelectedHand(null)
    const validSituations = SITUATIONS_BY_POSITION[pos]
    if (!validSituations.includes(situation)) setSituation(validSituations[0])
  }, [situation, isLocked])

  const handleSituationChange = useCallback((sit) => {
    if (isLocked(`sit:${position}:${sit}`)) return
    setSituation(sit)
    setSelectedHand(null)
  }, [position, isLocked])

  const getCurrentRange = useCallback(() => {
    try {
      const posData = ranges[gameType]?.[stackDepth]?.[position]
      if (!posData) return null
      return posData[situation] || posData[SITUATIONS_BY_POSITION[position][0]] || null
    } catch { return null }
  }, [gameType, stackDepth, position, situation])

  const currentRange = getCurrentRange()

  // The feature key for gating the current view
  const matrixFeature = isLocked(`pos:${position}`)
    ? `pos:${position}`
    : isLocked(`sit:${position}:${situation}`)
      ? `sit:${position}:${situation}`
      : null

  const matrixContent = (
    <motion.div
      key={`${position}-${situation}-${gameType}-${stackDepth}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <HandMatrix
        rangeData={currentRange}
        selectedHand={selectedHand}
        onSelectHand={(hand) => { setSelectedHand(hand); setMobileTab('detail') }}
      />
    </motion.div>
  )

  if (quizMode) {
    return (
      <div className="min-h-screen bg-bg text-cream font-body">
        <div className="hero-glow" />
        <PricingModal />
        <LoginModal />
        <Header
          gameType={gameType} setGameType={setGameType}
          stackDepth={stackDepth} setStackDepth={setStackDepth}
          quizMode={quizMode} setQuizMode={setQuizMode}
        />
        <QuizMode gameType={gameType} stackDepth={stackDepth} onExit={() => setQuizMode(false)} />
        {/* AffiliateBar hidden in quiz — post-quiz modal handles affiliate placement there */}
        <AffiliateBar quizMode />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-cream font-body">
      <div className="hero-glow" />

      {/* Global modals — rendered once at root level */}
      <PricingModal />
      <LoginModal />

      <Header
        gameType={gameType} setGameType={setGameType}
        stackDepth={stackDepth} setStackDepth={setStackDepth}
        quizMode={quizMode} setQuizMode={setQuizMode}
        onOpenPdfExport={() => setShowPdfExport(true)}
      />

      <PdfExportModal
        isOpen={showPdfExport}
        onClose={() => setShowPdfExport(false)}
        gameType={gameType} stackDepth={stackDepth}
        currentPosition={position} currentSituation={situation}
      />

      {/* Mobile tab bar */}
      <div className="lg:hidden flex border-b border-gold/10 bg-surface/80 backdrop-blur-sm sticky top-[60px] z-30">
        {[
          { id: 'table',  label: '♠ Mesa'    },
          { id: 'matrix', label: '⊞ Rango'   },
          { id: 'detail', label: '◈ Detalle' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              mobileTab === tab.id
                ? 'text-gold border-b-2 border-gold'
                : 'text-cream-dim hover:text-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="relative z-10 max-w-[1600px] mx-auto px-3 pt-4 pb-12 lg:px-6">

        {/* ── Desktop: 3-column layout ── */}
        <div className="hidden lg:grid grid-cols-[280px_1fr_300px] gap-5 items-start">

          {/* Left: Poker Table + Situation tabs */}
          <div className="sticky top-4">
            <PokerTable position={position} onSelectPosition={handlePositionChange} />
            <SituationTabs position={position} situation={situation} onChange={handleSituationChange} />
          </div>

          {/* Center: Matrix (gated when locked) + Coach Notes */}
          <div>
            {matrixFeature ? (
              <ProGate feature={matrixFeature} minHeight="480px">
                {matrixContent}
              </ProGate>
            ) : (
              matrixContent
            )}
            <CoachNotes gameType={gameType} position={position} />
          </div>

          {/* Right: Hand detail */}
          <div className="sticky top-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedHand || 'empty'}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <HandDetailPanel
                  hand={selectedHand}
                  rangeData={currentRange}
                  position={position}
                  situation={situation}
                  gameType={gameType}
                  stackDepth={stackDepth}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile: tabbed layout ── */}
        <div className="lg:hidden">
          <AnimatePresence mode="wait">
            {mobileTab === 'table' && (
              <motion.div key="table"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <PokerTable
                  position={position}
                  onSelectPosition={(p) => { handlePositionChange(p); setMobileTab('matrix') }}
                />
                <SituationTabs position={position} situation={situation} onChange={handleSituationChange} />
              </motion.div>
            )}

            {mobileTab === 'matrix' && (
              <motion.div key="matrix"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {matrixFeature ? (
                  <ProGate feature={matrixFeature} minHeight="400px">
                    {matrixContent}
                  </ProGate>
                ) : (
                  matrixContent
                )}
                <CoachNotes gameType={gameType} position={position} />
              </motion.div>
            )}

            {mobileTab === 'detail' && (
              <motion.div key="detail"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <HandDetailPanel
                  hand={selectedHand}
                  rangeData={currentRange}
                  position={position}
                  situation={situation}
                  gameType={gameType}
                  stackDepth={stackDepth}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gold/10 py-6 px-6 text-center pb-16 lg:pb-6">
        <p className="text-cream-muted text-xs leading-relaxed max-w-2xl mx-auto">
          Rangos basados en aproximaciones GTO para 6-max NLHE 100bb (GTO Wizard, PioSOLVER).{' '}
          <strong className="text-cream-dim">Para uso educativo únicamente.</strong>{' '}
          Ajusta siempre según los reads y la dinámica específica de tu mesa.
        </p>
        <p className="text-cream-muted/50 text-xs mt-2 font-display tracking-widest">
          PREFLOP VISION — GTO REFERENCE TOOL
        </p>
        <button
          onClick={() => navigate('/play')}
          className="mt-3 text-[11px] text-cream-muted/40 hover:text-gold/60 transition-colors underline underline-offset-2"
        >
          ¿Listo para la mesa real? Salas recomendadas →
        </button>
      </footer>

      {/* Fixed bottom affiliate bar — desktop only, outside quiz */}
      <AffiliateBar quizMode={false} />
    </div>
  )
}
