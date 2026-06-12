import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { ranges, SITUATIONS_BY_POSITION, SITUATION_LABELS, RANKS, getHandKey } from '../data/ranges'
import { loadStats } from '../quiz/quizStats'
import {
  createPdf, fillBackground, drawPageHeader,
  addMatrixImage, drawLegend, drawFooter,
  drawColumnLabel,
} from '../utils/exportPdf'

// ─── Off-screen matrix renderer (pure inline styles, no Tailwind) ─────────────

function getActionStyle(action, frequency) {
  const pct = Math.round((frequency ?? 0) * 100)
  if (action === 'raise')    return { background: '#C9A84C' }
  if (action === 'call')     return { background: '#3498DB' }
  if (action === 'mixed_rf') return { background: `linear-gradient(to bottom, #C9A84C ${pct}%, #1E1E2C ${pct}%)` }
  if (action === 'mixed_rc') return { background: `linear-gradient(to bottom, #C9A84C ${pct}%, #3498DB ${pct}%)` }
  return { background: '#1E1E2C' }
}

function PdfMatrixRenderer({ rangeData }) {
  if (!rangeData) return null

  return (
    <div style={{ background: '#0D0D12', padding: 8, width: '100%', boxSizing: 'border-box' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '18px repeat(13, 1fr)',
        gap: 2,
      }}>
        {/* Top-left corner */}
        <div />
        {/* Column headers */}
        {RANKS.map(rank => (
          <div key={rank} style={{
            textAlign: 'center', fontSize: 9, fontWeight: 700,
            color: '#706050', fontFamily: 'Inter, system-ui, sans-serif',
            padding: '1px 0',
          }}>
            {rank}
          </div>
        ))}

        {/* Rows */}
        {RANKS.flatMap((rowRank, row) => [
          <div key={`rl-${row}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#706050',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {rowRank}
          </div>,

          ...RANKS.map((_, col) => {
            const hand   = getHandKey(row, col)
            const data   = rangeData[hand] || { action: 'fold', frequency: 0 }
            const isSuited = row < col
            const isPair   = row === col
            const outline  = isSuited
              ? '1.5px solid rgba(232,199,107,0.45)'
              : isPair
                ? '1px solid rgba(255,255,255,0.15)'
                : '1px solid rgba(80,72,60,0.25)'

            return (
              <div
                key={`${row}-${col}`}
                style={{
                  ...getActionStyle(data.action, data.frequency),
                  outline,
                  borderRadius: 2,
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: data.action === 'fold' ? 'rgba(160,152,120,0.25)' : 'rgba(255,255,255,0.9)',
                  textShadow: data.action !== 'fold' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  userSelect: 'none',
                }}
              >
                {hand}
              </div>
            )
          }),
        ])}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildExportQueue(content, gameType, stackDepth, currentPosition, currentSituation, proMode) {
  if (content === 'current') {
    const rangeData = ranges[gameType]?.[stackDepth]?.[currentPosition]?.[currentSituation] ?? null
    return [{ position: currentPosition, situation: currentSituation, rangeData }]
  }

  if (content === 'all') {
    const queue = []
    const posData = ranges[gameType]?.[stackDepth]
    if (!posData) return []
    Object.entries(SITUATIONS_BY_POSITION).forEach(([pos, sits]) => {
      sits.forEach(sit => {
        const rd = posData[pos]?.[sit] ?? null
        if (rd) queue.push({ position: pos, situation: sit, rangeData: rd })
      })
    })
    return queue
  }

  if (content === 'weak') {
    const stats = loadStats()
    const weak  = Object.values(stats.weakSpots ?? {}).filter(s => s.errors >= 2)
    if (weak.length === 0) return []
    return weak.map(ws => ({
      position:  ws.position,
      situation: ws.situation,
      rangeData: ranges[gameType]?.[stackDepth]?.[ws.position]?.[ws.situation] ?? null,
    })).filter(item => item.rangeData)
  }

  return []
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function PdfExportModal({
  isOpen, onClose,
  gameType, stackDepth,
  currentPosition, currentSituation,
}) {
  const [content,   setContent]   = useState('current')
  const [format,    setFormat]    = useState('portrait')
  const [phase,     setPhase]     = useState('options')   // 'options' | 'generating' | 'done' | 'error'
  const [progress,  setProgress]  = useState({ done: 0, total: 0 })
  const [errorMsg,  setErrorMsg]  = useState('')
  const [captureItem, setCaptureItem] = useState(null)

  const hiddenRef   = useRef(null)
  const exportState = useRef(null)  // { pdf, queue, pairBuffer, orientation, resolve, reject }

  // Reset when reopened
  useEffect(() => {
    if (isOpen) { setPhase('options'); setProgress({ done: 0, total: 0 }); setErrorMsg('') }
  }, [isOpen])

  // Capture effect — fires whenever captureItem changes
  useEffect(() => {
    if (!captureItem || !hiddenRef.current) return
    const state = exportState.current
    if (!state) return

    // Double rAF to ensure browser painted the new rangeData
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(async () => {
        try {
          const canvas = await html2canvas(hiddenRef.current, {
            scale: 2,
            backgroundColor: '#0D0D12',
            useCORS: true,
            logging: false,
            allowTaint: true,
          })
          const imgDataUrl = canvas.toDataURL('image/png')
          const { pdf, orientation } = state

          if (orientation === 'landscape') {
            // Pair two matrices side-by-side on one page
            if (!state.pairBuffer) {
              // First of pair — buffer it
              state.pairBuffer = { imgDataUrl, item: captureItem }
            } else {
              // Second of pair — flush both onto a page
              const leftItem  = state.pairBuffer
              const rightItem = { imgDataUrl, item: captureItem }
              addLandscapePage(pdf, leftItem, rightItem)
              state.pairBuffer = null
            }
          } else {
            // Portrait: one matrix per page
            addPortraitPage(pdf, captureItem, imgDataUrl)
          }

          const done = state.progress + 1
          state.progress = done
          setProgress({ done, total: state.total })

          if (state.queue.length > 0) {
            const next = state.queue.shift()
            setCaptureItem(next)
          } else {
            // Flush any buffered landscape page (odd total)
            if (state.pairBuffer) {
              addLandscapePage(pdf, state.pairBuffer, null)
              state.pairBuffer = null
            }
            const date = new Date().toISOString().slice(0, 10)
            pdf.save(`preflop-vision-rangos-${date}.pdf`)
            setCaptureItem(null)
            setPhase('done')
          }
        } catch (err) {
          console.error('PDF export error:', err)
          setCaptureItem(null)
          setErrorMsg('Error al generar el PDF. Por favor, inténtalo de nuevo.')
          setPhase('error')
        }
      })
      return () => cancelAnimationFrame(raf2)
    })
    return () => cancelAnimationFrame(raf1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureItem])

  function addPortraitPage(pdf, item, imgDataUrl) {
    if (pdf.__firstPageUsed) {
      pdf.addPage()
    } else {
      pdf.__firstPageUsed = true
    }
    fillBackground(pdf, 'portrait')
    const sitLabel = SITUATION_LABELS[item.situation] ?? item.situation
    drawPageHeader(pdf, item.position, item.situation, sitLabel, 'portrait')
    addMatrixImage(pdf, imgDataUrl, 'portrait', 0)
    drawLegend(pdf, 'portrait', 0)
    drawFooter(pdf, 'portrait')
  }

  function addLandscapePage(pdf, leftPair, rightPair) {
    if (pdf.__firstPageUsed) {
      pdf.addPage()
    } else {
      pdf.__firstPageUsed = true
    }
    fillBackground(pdf, 'landscape')

    // Single shared header for the page (use left item's info, or combined)
    const sitLabelL = SITUATION_LABELS[leftPair.item.situation] ?? leftPair.item.situation
    drawPageHeader(pdf, leftPair.item.position, leftPair.item.situation, sitLabelL, 'landscape')

    // Left matrix
    drawColumnLabel(pdf, leftPair.item.position, sitLabelL, 'landscape', 0)
    addMatrixImage(pdf, leftPair.imgDataUrl, 'landscape', 0)
    drawLegend(pdf, 'landscape', 0)

    // Right matrix (if any)
    if (rightPair) {
      const sitLabelR = SITUATION_LABELS[rightPair.item.situation] ?? rightPair.item.situation
      drawColumnLabel(pdf, rightPair.item.position, sitLabelR, 'landscape', 1)
      addMatrixImage(pdf, rightPair.imgDataUrl, 'landscape', 1)
      drawLegend(pdf, 'landscape', 1)
    }

    drawFooter(pdf, 'landscape')
  }

  const handleExport = useCallback(() => {
    const queue = buildExportQueue(content, gameType, stackDepth, currentPosition, currentSituation)

    if (queue.length === 0) {
      if (content === 'weak') {
        setErrorMsg('No hay rangos débiles registrados. Juega más preguntas en el Quiz primero.')
      } else {
        setErrorMsg('No se encontraron rangos para exportar.')
      }
      setPhase('error')
      return
    }

    const orientation = format === 'landscape' ? 'landscape' : 'portrait'
    const pdf = createPdf(orientation)
    // jsPDF starts with page 1 already created. We track whether
    // we've used it so the first addPortraitPage/addLandscapePage
    // skips addPage() and just draws on the existing page.
    pdf.__firstPageUsed = false

    const total = queue.length
    exportState.current = {
      pdf,
      queue: queue.slice(1),   // rest of queue after first item
      pairBuffer: null,
      orientation,
      progress: 0,
      total,
    }

    setPhase('generating')
    setProgress({ done: 0, total })
    setCaptureItem(queue[0])
  }, [content, format, gameType, stackDepth, currentPosition, currentSituation])

  if (!isOpen) return null

  const CONTENT_OPTIONS = [
    { id: 'current', label: 'Posición actual', desc: `${currentPosition} — ${SITUATION_LABELS[currentSituation] ?? currentSituation}` },
    { id: 'all',     label: 'Todas las posiciones', desc: '~18 páginas, todas las posiciones y situaciones' },
    { id: 'weak',    label: 'Rangos débiles', desc: 'Solo las posiciones con más errores en el Quiz' },
  ]

  const FORMAT_OPTIONS = [
    { id: 'portrait',  label: 'A4 Vertical', desc: '1 rango por página' },
    { id: 'landscape', label: 'A4 Horizontal', desc: '2 rangos por página' },
  ]

  return (
    <>
      {/* Off-screen render target — fixed left edge to avoid interfering with visible layout */}
      <div
        ref={hiddenRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-2000px',
          top: '0',
          width: '780px',
          background: '#0D0D12',
          overflow: 'hidden',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {captureItem != null && (
          <PdfMatrixRenderer rangeData={captureItem.rangeData} />
        )}
      </div>

      {/* Modal backdrop + panel */}
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={phase !== 'generating' ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-lg rounded-2xl border border-gold/20 shadow-2xl"
            style={{ background: '#1A1A24' }}
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gold/10">
              <div>
                <h2 className="font-display font-bold text-base text-cream tracking-wide">
                  Exportar PDF
                </h2>
                <p className="text-xs text-cream-muted mt-0.5">
                  Exporta los rangos como PDF para estudio offline
                </p>
              </div>
              {phase !== 'generating' && (
                <button
                  onClick={onClose}
                  className="text-cream-muted hover:text-cream transition-colors text-lg leading-none ml-4"
                >
                  ×
                </button>
              )}
              {/* Pro badge */}
              <span
                className="ml-auto mr-0 text-[9px] font-bold px-2 py-0.5 rounded-full font-display"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.1))',
                  border: '1px solid rgba(201,168,76,0.4)',
                  color: '#E8C76B',
                }}
              >
                PRO ✦
              </span>
            </div>

            {/* Body */}
            <div className="px-6 py-5">

              {/* ── Options ── */}
              {phase === 'options' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
                >
                  {/* Content selection */}
                  <p className="text-xs font-semibold text-cream-muted uppercase tracking-widest mb-3">
                    Contenido
                  </p>
                  <div className="space-y-2 mb-5">
                    {CONTENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setContent(opt.id)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left"
                        style={{
                          background: content === opt.id ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                          borderColor: content === opt.id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div
                          className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          style={{
                            borderColor: content === opt.id ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {content === opt.id && (
                            <div className="w-2 h-2 rounded-full" style={{ background: '#C9A84C' }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-cream leading-none mb-1">{opt.label}</p>
                          <p className="text-xs text-cream-muted">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Format selection */}
                  <p className="text-xs font-semibold text-cream-muted uppercase tracking-widest mb-3">
                    Formato
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {FORMAT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setFormat(opt.id)}
                        className="p-3 rounded-xl border transition-all text-left"
                        style={{
                          background: format === opt.id ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                          borderColor: format === opt.id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {/* Page icon */}
                          <div
                            className="flex-shrink-0 border rounded-sm"
                            style={{
                              width:  opt.id === 'portrait' ? 10 : 14,
                              height: opt.id === 'portrait' ? 14 : 10,
                              borderColor: format === opt.id ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                              background:  format === opt.id ? 'rgba(201,168,76,0.15)' : 'transparent',
                            }}
                          />
                          <span className="text-xs font-semibold text-cream">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-cream-muted">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Export button */}
                  <motion.button
                    onClick={handleExport}
                    className="w-full py-3 rounded-xl font-display font-bold text-sm text-bg tracking-wide transition-all"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C76B)' }}
                    whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Exportar PDF →
                  </motion.button>
                </motion.div>
              )}

              {/* ── Generating ── */}
              {phase === 'generating' && (
                <motion.div
                  className="py-4 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                >
                  <div className="mb-5">
                    <div
                      className="w-12 h-12 rounded-full border-2 mx-auto mb-4"
                      style={{
                        borderColor: '#C9A84C',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <p className="font-display font-bold text-sm text-cream mb-1">
                      Generando tu PDF...
                    </p>
                    <p className="text-xs text-cream-muted">
                      {progress.done} / {progress.total} {progress.total === 1 ? 'rango' : 'rangos'} procesados
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #C9A84C, #E8C76B)' }}
                      initial={{ width: 0 }}
                      animate={{
                        width: progress.total > 0
                          ? `${(progress.done / progress.total) * 100}%`
                          : '0%'
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>

                  <p className="text-[11px] text-cream-muted/50 mt-4">
                    No cierres esta ventana hasta que termine
                  </p>
                </motion.div>
              )}

              {/* ── Done ── */}
              {phase === 'done' && (
                <motion.div
                  className="py-4 text-center"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                    style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)' }}
                  >
                    ✓
                  </div>
                  <p className="font-display font-bold text-base text-cream mb-1">
                    ¡PDF generado!
                  </p>
                  <p className="text-xs text-cream-muted mb-5">
                    El archivo se ha descargado automáticamente.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPhase('options')}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-gold/20 text-cream-dim hover:text-cream hover:border-gold/40 transition-all"
                    >
                      Exportar otro
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-bg transition-all"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C76B)' }}
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Error ── */}
              {phase === 'error' && (
                <motion.div
                  className="py-4 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                    style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)' }}
                  >
                    ⚠
                  </div>
                  <p className="font-display font-bold text-sm text-cream mb-2">
                    {errorMsg || 'Ocurrió un error inesperado'}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setPhase('options')}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-gold/20 text-cream-dim hover:text-cream transition-all"
                    >
                      Volver
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-cream-muted/20 text-cream-muted hover:text-cream transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
