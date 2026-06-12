// Quiz statistics — all quiz tracking in one localStorage key
const STATS_KEY = 'pv_quiz_stats'
const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']

function defaultStats() {
  const byPosition = {}
  ALL_POSITIONS.forEach(p => { byPosition[p] = { correct: 0, total: 0 } })
  return {
    totalAnswered: 0,
    correct: 0,
    bestStreak: 0,
    byPosition,
    weakSpots: {},     // key: `${hand}|${pos}|${sit}` → { hand, position, situation, errors }
    dailyCount: 0,
    todayCorrect: 0,
    lastReset: new Date().toDateString(),
    history: [],       // { date, correct, total } — last 30 days (Pro feature)
  }
}

function save(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch {}
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return defaultStats()
    const saved = JSON.parse(raw)
    const def = defaultStats()
    return {
      ...def,
      ...saved,
      byPosition: { ...def.byPosition, ...(saved.byPosition ?? {}) },
      weakSpots: saved.weakSpots ?? {},
      history: saved.history ?? [],
    }
  } catch {
    return defaultStats()
  }
}

// Returns today's question count; resets to 0 if it's a new day
export function getDailyCount(stats) {
  if (stats.lastReset !== new Date().toDateString()) return 0
  return stats.dailyCount
}

// Persists a single answer result and returns the updated stats object
export function recordAnswer({ hand, position, situation, isCorrect }) {
  let s = loadStats()
  const today = new Date().toDateString()

  // Midnight reset — archive yesterday in history
  if (s.lastReset !== today) {
    const entry = { date: s.lastReset, correct: s.todayCorrect, total: s.dailyCount }
    s.history = [...s.history, entry].filter(h => h.total > 0).slice(-30)
    s.dailyCount   = 0
    s.todayCorrect = 0
    s.lastReset    = today
  }

  s.totalAnswered += 1
  s.dailyCount    += 1
  if (isCorrect) {
    s.correct      += 1
    s.todayCorrect += 1
  }

  // Per-position breakdown
  if (!s.byPosition[position]) s.byPosition[position] = { correct: 0, total: 0 }
  s.byPosition[position].total += 1
  if (isCorrect) s.byPosition[position].correct += 1

  // Weak spots — track misses only
  if (!isCorrect) {
    const key = `${hand}|${position}|${situation}`
    s.weakSpots[key] = s.weakSpots[key]
      ? { ...s.weakSpots[key], errors: s.weakSpots[key].errors + 1 }
      : { hand, position, situation, errors: 1 }
  }

  save(s)
  return s
}

// Update bestStreak in localStorage if new record; returns (possibly updated) stats
export function updateBestStreak(streak, stats) {
  if (streak > (stats.bestStreak ?? 0)) {
    const updated = { ...stats, bestStreak: streak }
    save(updated)
    return updated
  }
  return stats
}

// Returns top N weak spots with ≥2 errors, sorted by error count
export function getTopWeakSpots(stats, limit = 5) {
  return Object.values(stats.weakSpots ?? {})
    .filter(s => s.errors >= 2)
    .sort((a, b) => b.errors - a.errors)
    .slice(0, limit)
}

export function clearStats() {
  localStorage.removeItem(STATS_KEY)
}
