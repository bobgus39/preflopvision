// Weighted question generator for the Quiz/Trainer mode
// Weights: 40% mixed hands (most educational), 35% raise, 15% fold, 10% call
import { ranges, POSITIONS_6MAX, SITUATIONS_BY_POSITION } from '../data/ranges'
import { FREE_POSITIONS, FREE_SITUATIONS } from '../context/AuthContext'

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Bucket each hand in a range into action categories
function categorize(rangeData) {
  const cats = { mixed: [], raise: [], fold: [], call: [] }
  for (const [hand, d] of Object.entries(rangeData)) {
    if (d.action === 'mixed_rf' || d.action === 'mixed_rc') {
      // Only include genuinely split hands (not 90%+ one action)
      if (d.frequency >= 0.15 && d.frequency <= 0.85) {
        cats.mixed.push({ hand, ...d })
      } else if (d.frequency > 0.85) {
        cats.raise.push({ hand, ...d })
      } else {
        cats.fold.push({ hand, ...d })
      }
    } else if (d.action === 'raise') {
      cats.raise.push({ hand, ...d })
    } else if (d.action === 'call') {
      cats.call.push({ hand, ...d })
    } else {
      cats.fold.push({ hand, ...d })
    }
  }
  return cats
}

const WEIGHTS = [
  { cat: 'mixed', w: 0.40 },
  { cat: 'raise', w: 0.35 },
  { cat: 'fold',  w: 0.15 },
  { cat: 'call',  w: 0.10 },
]

function pickCategory(cats) {
  const available = WEIGHTS.filter(({ cat }) => cats[cat].length > 0)
  if (!available.length) return null
  const total = available.reduce((s, { w }) => s + w, 0)
  let r = Math.random() * total
  for (const { cat, w } of available) {
    r -= w
    if (r <= 0) return cat
  }
  return available[available.length - 1].cat
}

// Returns the set of actions a player must choose from to be "correct"
// Mixed hands allow either component action — both are GTO-valid
export function getCorrectAnswers(action) {
  if (action === 'raise')    return ['raise']
  if (action === 'call')     return ['call']
  if (action === 'mixed_rf') return ['raise', 'fold']
  if (action === 'mixed_rc') return ['raise', 'call']
  return ['fold']
}

// Generate one question using weighted random hand selection
// avoidHand: hand key to skip on first few attempts (prevents identical consecutive questions)
export function generateQuestion({ gameType, stackDepth, proMode, avoidHand = null }) {
  const positions = proMode
    ? POSITIONS_6MAX
    : POSITIONS_6MAX.filter(p => FREE_POSITIONS.has(p))

  for (let attempt = 0; attempt < 12; attempt++) {
    const position = randomItem(positions)
    const allSits  = SITUATIONS_BY_POSITION[position] ?? []
    const sits     = proMode ? allSits : allSits.filter(s => FREE_SITUATIONS.has(s))
    if (!sits.length) continue

    const situation = randomItem(sits)
    const rangeData = ranges[gameType]?.[stackDepth]?.[position]?.[situation]
    if (!rangeData) continue

    const cats = categorize(rangeData)
    const cat  = pickCategory(cats)
    if (!cat) continue

    const picked = randomItem(cats[cat])
    // Avoid the immediately previous hand for variety (first 6 attempts only)
    if (picked.hand === avoidHand && attempt < 6) continue

    return {
      hand:           picked.hand,
      position,
      situation,
      gameType,
      stackDepth,
      action:         picked.action,
      frequency:      picked.frequency,
      correctAnswers: getCorrectAnswers(picked.action),
    }
  }

  return null
}
