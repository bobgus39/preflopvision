import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getHandName, ACTION_COLORS, SITUATION_LABELS } from '../data/ranges'
import { useAuth } from '../context/AuthContext'
import ProGate from './ProGate'
import { generateQuestion } from '../quiz/questionGenerator'
import { loadStats, getDailyCount, recordAnswer, updateBestStreak } from '../quiz/quizStats'
import { playCorrect, playWrong, playStreak } from '../quiz/sounds'
import StatsPanel from './quiz/StatsPanel'
import { PRIMARY_ROOM } from '../affiliate/data'
import { trackAffiliateClick, shouldShowPostQuizAffiliate, markPostQuizAffiliateShown } from '../affiliate/tracking'

const FREE_QUIZ_LIMIT = 10
const POST_QUIZ_TRIGGER = 10  // Show affiliate prompt after this many answered questions

// ─── Playing card constants ───────────────────────────────────────────────────

const SUITS  = ['♠', '♥', '♦', '♣']
const SUIT_COLORS = ['#8aabb8', '#c0392b', '#c0392b', '#8aabb8']

// ─── Action config ────────────────────────────────────────────────────────────

const ACTIONS = [
  { id: 'raise', label: 'Raise', emoji: '↑', kbd: '1',
    color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.45)' },
  { id: 'call',  label: 'Call',  emoji: '=', kbd: '2',
    color: '#3498DB', bg: 'rgba(52,152,219,0.12)',  border: 'rgba(52,152,219,0.45)' },
  { id: 'fold',  label: 'Fold',  emoji: '✗', kbd: '3',
    color: '#E74C3C', bg: 'rgba(231,76,60,0.12)',   border: 'rgba(231,76,60,0.45)' },
]

// ─── Short contextual explanations ───────────────────────────────────────────

function getExplanation({ hand, position, action }) {
  const PREMIUM = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']
  const EARLY   = ['UTG', 'HJ']

  if (PREMIUM.includes(hand))                          return 'Mano premium — siempre abrir con raise.'
  if (action === 'raise' && EARLY.includes(position))  return 'Mano con suficiente EV para abrir desde posición temprana.'
  if (action === 'raise')                              return 'Apertura estándar — buena mano para este rango.'
  if (action === 'call')                               return 'Mejor flat — tiene playabilidad pero no valor ISO suficiente.'
  if (action.startsWith('mixed'))                      return 'GTO equilibra esta mano. Ambas acciones tienen EV muy similar.'
  if (EARLY.includes(position))                        return 'UTG/HJ requiere rango muy selecto — esta mano no alcanza el umbral.'
  return 'Demasiado débil para abrir en esta situación.'
}

// ─── Playing card with flip animation ────────────────────────────────────────

function FlipCard({ rank, suitIdx, delay = 0 }) {
  return (
    <motion.div
      className="playing-card select-none"
      style={{ color: SUIT_COLORS[suitIdx], width: 64, height: 90 }}
      initial={{ scaleX: 0.04, opacity: 0.2 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="self-start text-left leading-none" style={{ fontSize: 15, fontWeight: 800 }}>
        <div style={{ lineHeight: 1.1 }}>{rank}</div>
        <div style={{ fontSize: 12 }}>{SUITS[suitIdx]}</div>
      </div>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{SUITS[suitIdx]}</div>
      <div className="self-end text-right leading-none rotate-180" style={{ fontSize: 15, fontWeight: 800 }}>
        <div style={{ lineHeight: 1.1 }}>{rank}</div>
        <div style={{ fontSize: 12 }}>{SUITS[suitIdx]}</div>
      </div>
    </motion.div>
  )
}

function StaticCard({ rank, suitIdx }) {
  return (
    <div
      className="playing-card select-none"
      style={{ color: SUIT_COLORS[suitIdx], width: 64, height: 90 }}
    >
      <div className="self-start text-left leading-none" style={{ fontSize: 15, fontWeight: 800 }}>
        <div style={{ lineHeight: 1.1 }}>{rank}</div>
        <div style={{ fontSize: 12 }}>{SUITS[suitIdx]}</div>
      </div>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{SUITS[suitIdx]}</div>
      <div className="self-end text-right leading-none rotate-180" style={{ fontSize: 15, fontWeight: 800 }}>
        <div style={{ lineHeight: 1.1 }}>{rank}</div>
        <div style={{ fontSize: 12 }}>{SUITS[suitIdx]}</div>
      </div>
    </div>
  )
}

function HandCards({ hand, animate = false }) {
  const isPair   = hand.length === 2 && hand[0] === hand[1]
  const isSuited = hand.endsWith('s')
  const r1 = hand[0]
  const r2 = isPair ? hand[1] : hand[1]

  // Suit indices: suited → both diamonds, pair → spade+heart, offsuit → spade+club
  const [s1, s2] = isSuited ? [2, 2] : isPair ? [0, 1] : [0, 3]

  if (animate) {
    return (
      <div className="flex justify-center gap-4">
        <FlipCard rank={r1} suitIdx={s1} delay={0} />
        <FlipCard rank={r2} suitIdx={s2} delay={0.13} />
      </div>
    )
  }
  return (
    <div className="flex justify-center gap-4">
      <StaticCard rank={r1} suitIdx={s1} />
      <StaticCard rank={r2} suitIdx={s2} />
    </div>
  )
}

// ─── Context pills ────────────────────────────────────────────────────────────

function ContextPills({ position, situation, stackDepth, gameType }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-display text-gold bg-gold/10 border border-gold/25">
        {position}
      </span>
      <span className="px-2 py-0.5 rounded-full text-[11px] text-cream-dim bg-surface-2 border border-gold/10">
        {SITUATION_LABELS?.[situation] ?? situation}
      </span>
      {gameType === 'mtt' && (
        <span className="px-2 py-0.5 rounded-full text-[11px] text-cream-dim bg-surface-2 border border-gold/10">
          MTT
        </span>
      )}
      {stackDepth !== '100bb' && (
        <span className="px-2 py-0.5 rounded-full text-[11px] text-cream-dim bg-surface-2 border border-gold/10">
          {stackDepth}
        </span>
      )}
    </div>
  )
}

// ─── Action button (question phase) ──────────────────────────────────────────

function ActionButton({ action, onPress }) {
  const cfg = ACTIONS.find(a => a.id === action)
  return (
    <motion.button
      onClick={onPress}
      className="flex flex-col items-center justify-center py-4 rounded-xl border font-bold transition-colors"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
      whileHover={{ scale: 1.03, boxShadow: `0 0 18px ${cfg.bg}` }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="text-2xl mb-1 leading-none">{cfg.emoji}</span>
      <span className="text-sm font-display tracking-wide">{cfg.label}</span>
      <span className="text-[9px] opacity-35 mt-0.5">tecla {cfg.kbd}</span>
    </motion.button>
  )
}

// ─── Action button (feedback phase) — shows correct/wrong state ───────────────

function PostAnswerButton({ action, userAnswer, correctAnswers }) {
  const cfg        = ACTIONS.find(a => a.id === action)
  const wasChosen  = action === userAnswer
  const isAccepted = correctAnswers.includes(action)

  let borderColor, bgColor, textColor, opacity, icon

  if (wasChosen && isAccepted) {
    borderColor = '#2ECC71'; bgColor = 'rgba(46,204,113,0.15)'; textColor = '#2ECC71'; opacity = 1
    icon = '✓'
  } else if (wasChosen && !isAccepted) {
    borderColor = '#E74C3C'; bgColor = 'rgba(231,76,60,0.15)'; textColor = '#E74C3C'; opacity = 1
    icon = '✗'
  } else if (!wasChosen && isAccepted) {
    // Alternative correct action (shown faintly)
    borderColor = 'rgba(46,204,113,0.4)'; bgColor = 'rgba(46,204,113,0.07)'; textColor = '#2ECC71'; opacity = 0.7
    icon = '→'
  } else {
    borderColor = 'rgba(255,255,255,0.06)'; bgColor = 'transparent'; textColor = 'rgba(255,255,255,0.2)'; opacity = 0.28
    icon = cfg.emoji
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-4 rounded-xl border font-bold"
      style={{ background: bgColor, borderColor, opacity, color: textColor }}
    >
      <span className="text-2xl mb-1 leading-none">{icon}</span>
      <span className="text-sm font-display tracking-wide">{cfg.label}</span>
    </div>
  )
}

// ─── Mixed action frequency bar ───────────────────────────────────────────────

function FreqBar({ action, pct }) {
  if (!action.startsWith('mixed')) return null
  const isMixedRF = action === 'mixed_rf'
  const c1 = '#C9A84C'                             // raise color
  const c2 = isMixedRF ? '#E74C3C' : '#3498DB'     // fold or call
  const l2 = isMixedRF ? 'Fold' : 'Call'

  return (
    <div className="mt-2.5">
      <div className="h-2.5 rounded-full overflow-hidden flex">
        <motion.div
          style={{ background: c1, flexShrink: 0 }}
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="h-full flex-1" style={{ background: c2 }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px]">
        <span style={{ color: c1 }}>Raise {pct}%</span>
        <span style={{ color: c2 }}>{l2} {100 - pct}%</span>
      </div>
    </div>
  )
}

// ─── Question card (flip-animated cards) ─────────────────────────────────────

function QuestionCard({ question, onAnswer }) {
  return (
    <motion.div
      className="glass-panel rounded-2xl p-5 sm:p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.22 }}
    >
      <div className="mb-5">
        <ContextPills
          position={question.position}
          situation={question.situation}
          stackDepth={question.stackDepth}
          gameType={question.gameType}
        />
      </div>

      <div className="mb-4">
        <HandCards hand={question.hand} animate />
      </div>

      <p className="text-center font-display font-bold text-xl text-cream mb-1">
        {getHandName(question.hand)}
      </p>
      <p className="text-center text-[11px] text-cream-muted mb-6">
        ¿Cuál es la jugada correcta?
      </p>

      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map(a => (
          <ActionButton key={a.id} action={a.id} onPress={() => onAnswer(a.id)} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Feedback card ────────────────────────────────────────────────────────────

function FeedbackCard({ question, userAnswer, isCorrect, onNext }) {
  const pct = Math.round((question.frequency ?? 0) * 100)
  const isMixed = question.action.startsWith('mixed')

  let actionDesc
  if (isMixed) {
    const isRF = question.action === 'mixed_rf'
    actionDesc = `Raise ${pct}% / ${isRF ? 'Fold' : 'Call'} ${100 - pct}%`
  } else if (question.action === 'raise') {
    actionDesc = pct >= 95 ? 'Raise — siempre' : `Raise ${pct}%`
  } else if (question.action === 'call') {
    actionDesc = 'Call'
  } else {
    actionDesc = 'Fold'
  }

  return (
    <motion.div
      className="glass-panel rounded-2xl p-5 sm:p-6"
      style={{
        borderColor: isCorrect ? 'rgba(46,204,113,0.35)' : 'rgba(231,76,60,0.35)',
      }}
      initial={{ opacity: 0, scale: 0.975 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-4">
        <ContextPills
          position={question.position}
          situation={question.situation}
          stackDepth={question.stackDepth}
          gameType={question.gameType}
        />
      </div>

      <div className="mb-3">
        <HandCards hand={question.hand} animate={false} />
      </div>

      <p className="text-center font-display font-bold text-lg text-cream mb-4">
        {getHandName(question.hand)}
      </p>

      {/* Feedback box */}
      <div
        className="rounded-xl p-4 mb-4 border"
        style={{
          background:   isCorrect ? 'rgba(46,204,113,0.07)' : 'rgba(231,76,60,0.07)',
          borderColor:  isCorrect ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)',
        }}
      >
        <div
          className="text-center font-display font-bold text-xl mb-1"
          style={{ color: isCorrect ? '#2ECC71' : '#E74C3C' }}
        >
          {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
        </div>
        <p className="text-center text-sm font-semibold text-cream-dim">
          {actionDesc}
        </p>
        {isMixed && <FreqBar action={question.action} pct={pct} />}
        <p className="text-center text-[11px] text-cream-muted mt-2 leading-snug">
          {getExplanation(question)}
        </p>
      </div>

      {/* Action result buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {ACTIONS.map(a => (
          <PostAnswerButton
            key={a.id}
            action={a.id}
            userAnswer={userAnswer}
            correctAnswers={question.correctAnswers}
          />
        ))}
      </div>

      {/* Next question */}
      <motion.button
        onClick={onNext}
        className="w-full py-3 rounded-xl font-bold font-display text-bg tracking-wide text-sm"
        style={{ background: 'linear-gradient(135deg, #E8C76B, #C9A84C)' }}
        whileHover={{ scale: 1.01, boxShadow: '0 4px 18px rgba(201,168,76,0.35)' }}
        whileTap={{ scale: 0.98 }}
      >
        Siguiente pregunta →
        <span className="ml-2 text-[10px] font-normal opacity-45">Enter</span>
      </motion.button>
    </motion.div>
  )
}

// ─── Streak display with animated progress dots ───────────────────────────────

function StreakDisplay({ streak, bestStreak }) {
  const isOnFire = streak >= 5
  const DOT_COUNT = 10
  const filled = streak === 0 ? 0 : ((streak - 1) % DOT_COUNT) + 1

  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
        style={{
          borderColor: isOnFire ? 'rgba(251,146,60,0.45)' : 'rgba(201,168,76,0.2)',
          background:  isOnFire ? 'rgba(251,146,60,0.08)' : 'rgba(26,26,36,0.8)',
        }}
        animate={isOnFire ? {
          boxShadow: [
            '0 0 0px rgba(251,146,60,0)',
            '0 0 12px rgba(251,146,60,0.3)',
            '0 0 0px rgba(251,146,60,0)',
          ],
        } : {}}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {isOnFire && <span className="text-base leading-none">🔥</span>}
        <span
          className="text-sm font-bold font-display leading-none"
          style={{ color: isOnFire ? '#fb923c' : '#F0EAD6' }}
        >
          {streak}
        </span>
        <span className="text-[10px] text-cream-muted leading-none">racha</span>
      </motion.div>

      {/* Progress dots cycling every 10 */}
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: DOT_COUNT }, (_, i) => {
          const active = i < filled
          return (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                background: active
                  ? (isOnFire ? '#fb923c' : '#C9A84C')
                  : 'rgba(255,255,255,0.09)',
              }}
              animate={active && isOnFire ? { opacity: [0.65, 1, 0.65] } : {}}
              transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.04 }}
            />
          )
        })}
      </div>

      {bestStreak > 0 && streak < bestStreak && (
        <span className="text-[10px] text-cream-muted hidden sm:inline">
          Mejor: {bestStreak}
        </span>
      )}
    </div>
  )
}

// ─── Post-quiz affiliate prompt (desktop only, once per day) ─────────────────

function PostQuizModal({ onContinue }) {
  const navigate = useNavigate()
  const room = PRIMARY_ROOM

  return (
    // hidden on mobile per placement rule: "en mobile solo mostrar en /play"
    <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }}
    >
      <motion.div
        className="w-full max-w-sm glass-panel rounded-2xl p-6"
        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-[11px] text-gold/60 uppercase tracking-widest mb-1.5">Buen trabajo</p>
          <h3 className="font-display text-lg font-bold text-cream leading-tight">
            ¿Lo probamos en mesa real?
          </h3>
          <p className="text-xs text-cream-muted mt-1.5 leading-snug">
            Aplica el preflop GTO que acabas de practicar contra rivales reales.
          </p>
        </div>

        {/* Mini room card */}
        <div
          className="rounded-xl p-4 mb-4 border"
          style={{ background: room.colorBg, borderColor: room.colorBorder }}
        >
          <div className="flex items-center gap-2 mb-1.5">
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
          <p className="text-sm font-bold text-gold mb-3">{room.bonus}</p>
          <motion.button
            onClick={() => {
              trackAffiliateClick(room.id, 'post_quiz', room.affiliateUrl)
              onContinue()
            }}
            className="w-full py-2.5 rounded-xl text-sm font-bold font-display text-bg tracking-wide"
            style={{ background: `linear-gradient(135deg, ${room.color}, ${room.color}bb)` }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {room.cta} →
          </motion.button>
        </div>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <button
            onClick={onContinue}
            className="flex-1 py-2 text-xs text-cream-muted hover:text-cream transition-colors text-center"
          >
            Seguir practicando →
          </button>
          <button
            onClick={() => navigate('/play')}
            className="flex-1 py-2 text-xs text-cream-muted/50 hover:text-cream-muted transition-colors text-center underline underline-offset-2"
          >
            Ver todas las salas
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Daily limit wall for free users ─────────────────────────────────────────

function LimitWall({ onExit }) {
  return (
    <div className="min-h-[60vh] flex flex-col">
      <ProGate feature="quiz_unlimited" minHeight="500px">
        {/* Blurred placeholder — gives a sense of what's locked */}
        <div className="max-w-2xl mx-auto px-4 py-8 opacity-20 pointer-events-none select-none space-y-4">
          <div className="flex items-center gap-3 glass-panel rounded-xl p-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="text-center flex-1">
                <div className="h-7 bg-surface-2 rounded w-8 mx-auto mb-1" />
                <div className="h-2.5 bg-surface-2 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex justify-center gap-4">
              <div className="w-16 h-[90px] bg-surface-2 rounded-lg" />
              <div className="w-16 h-[90px] bg-surface-2 rounded-lg" />
            </div>
            <div className="h-5 bg-surface-2 rounded w-40 mx-auto" />
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-16 bg-surface-2 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </ProGate>
      <div className="text-center mt-4">
        <button
          onClick={onExit}
          className="text-xs text-cream-muted hover:text-cream border border-gold/15 px-3 py-1.5 rounded-lg transition-all"
        >
          ← Volver al Reference
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function QuizMode({ gameType, stackDepth, onExit }) {
  const { isPro, openPricing } = useAuth()
  const proMode = isPro()

  // Stats from localStorage; refreshed after each answer
  const [stats, setStats] = useState(() => loadStats())
  // In-memory streak; authoritative for UI, bestStreak persisted via updateBestStreak
  const [streak, setStreak] = useState(0)

  // Question state machine: 'question' → handleAnswer → 'feedback' → nextQuestion → 'question'
  const [question,    setQuestion]    = useState(null)
  const [questionKey, setQuestionKey] = useState(0)
  const [phase,       setPhase]       = useState('question')
  const [userAnswer,  setUserAnswer]  = useState(null)
  const [isCorrect,   setIsCorrect]   = useState(null)

  // Post-quiz affiliate prompt
  const [sessionAnswered, setSessionAnswered] = useState(0)
  const [showPostQuiz,    setShowPostQuiz]    = useState(false)

  // Mobile stats panel toggle
  const [showStats, setShowStats] = useState(false)

  const dailyCount   = getDailyCount(stats)
  const limitReached = !proMode && dailyCount >= FREE_QUIZ_LIMIT

  // Generate first question on mount
  useEffect(() => {
    if (!limitReached) {
      setQuestion(generateQuestion({ gameType, stackDepth, proMode }))
    }
    // Only runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const advanceToNextQuestion = useCallback(() => {
    setShowPostQuiz(false)
    setPhase('question')
    setUserAnswer(null)
    setIsCorrect(null)
    setQuestionKey(k => k + 1)
    setQuestion(prev => generateQuestion({
      gameType, stackDepth, proMode, avoidHand: prev?.hand,
    }))
  }, [gameType, stackDepth, proMode])

  const nextQuestion = useCallback(() => {
    // After POST_QUIZ_TRIGGER answers, show the affiliate prompt once per day
    if (sessionAnswered >= POST_QUIZ_TRIGGER && shouldShowPostQuizAffiliate()) {
      markPostQuizAffiliateShown()
      setShowPostQuiz(true)
      return
    }
    advanceToNextQuestion()
  }, [sessionAnswered, advanceToNextQuestion])

  const handleAnswer = useCallback((actionId) => {
    if (phase !== 'question' || !question) return

    const correct   = question.correctAnswers.includes(actionId)
    const newStreak = correct ? streak + 1 : 0

    // Play appropriate sound
    if (correct) {
      if (newStreak >= 5 && newStreak > streak) playStreak()
      else playCorrect()
    } else {
      playWrong()
    }

    // Persist and compute new stats
    let newStats = recordAnswer({
      hand:      question.hand,
      position:  question.position,
      situation: question.situation,
      isCorrect: correct,
    })
    newStats = updateBestStreak(newStreak, newStats)

    setStreak(newStreak)
    setStats(newStats)
    setSessionAnswered(n => n + 1)
    setUserAnswer(actionId)
    setIsCorrect(correct)
    setPhase('feedback')
  }, [phase, question, streak])

  // Keyboard shortcuts: 1/2/3 to answer, Enter/Space to advance
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (phase === 'question') {
        if (e.key === '1') handleAnswer('raise')
        else if (e.key === '2') handleAnswer('call')
        else if (e.key === '3') handleAnswer('fold')
      } else if (phase === 'feedback') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQuestion() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, handleAnswer, nextQuestion])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (limitReached) return <LimitWall onExit={onExit} />

  if (!question) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <p className="text-cream-muted mb-4">
          No se pudo generar pregunta. Prueba con otra configuración.
        </p>
        <button onClick={onExit} className="text-gold underline text-sm">
          ← Volver
        </button>
      </div>
    )
  }

  const remaining = proMode ? null : FREE_QUIZ_LIMIT - dailyCount

  return (
    <div className="flex gap-5 max-w-5xl mx-auto px-4 pb-8">

      {/* ── Main column ── */}
      <div className="flex-1 min-w-0">

        {/* Top bar: streak + daily counter + exit */}
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <StreakDisplay streak={streak} bestStreak={stats.bestStreak || 0} />

          <div className="flex items-center gap-2 flex-wrap">
            {remaining !== null && (
              <button
                onClick={() => openPricing('quiz_unlimited')}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer"
                style={{
                  borderColor: remaining <= 3 ? 'rgba(231,76,60,0.45)' : 'rgba(201,168,76,0.2)',
                  color:       remaining <= 3 ? '#E74C3C' : '#706050',
                  background:  remaining <= 3 ? 'rgba(231,76,60,0.08)' : 'transparent',
                }}
                title="Pro: preguntas ilimitadas"
              >
                {remaining}/{FREE_QUIZ_LIMIT} hoy
              </button>
            )}

            {/* Stats toggle (mobile only) */}
            <button
              onClick={() => setShowStats(s => !s)}
              className="lg:hidden text-[11px] border border-gold/20 px-2.5 py-1.5 rounded-lg text-cream-muted hover:text-cream transition-all"
            >
              {showStats ? 'Ocultar stats' : 'Ver stats'}
            </button>

            <button
              onClick={onExit}
              className="text-[11px] text-cream-muted hover:text-cream border border-gold/20 hover:border-gold/35 px-3 py-1.5 rounded-lg transition-all"
            >
              ← Referencia
            </button>
          </div>
        </div>

        {/* Question / Feedback — swap with AnimatePresence */}
        <AnimatePresence mode="wait">
          {phase === 'question' ? (
            <QuestionCard
              key={`q-${questionKey}`}
              question={question}
              onAnswer={handleAnswer}
            />
          ) : (
            <FeedbackCard
              key={`f-${questionKey}`}
              question={question}
              userAnswer={userAnswer}
              isCorrect={isCorrect}
              onNext={nextQuestion}
            />
          )}
        </AnimatePresence>

        {/* Mobile: collapsible stats panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              className="lg:hidden mt-4 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
            >
              <StatsPanel stats={stats} streak={streak} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:block w-56 flex-shrink-0 pt-[52px]">
        <StatsPanel stats={stats} streak={streak} />
      </aside>

      {/* Post-quiz affiliate prompt — desktop only, once per day */}
      <AnimatePresence>
        {showPostQuiz && (
          <PostQuizModal key="post-quiz-modal" onContinue={advanceToNextQuestion} />
        )}
      </AnimatePresence>

    </div>
  )
}
