// Preflop Vision — GTO Range Data
// Based on 6-max NLHE solver outputs (GTO Wizard, PioSOLVER approximations)
// Actions: 'raise' | 'call' | 'mixed_rf' (raise/fold) | 'mixed_rc' (raise/call) | 'fold'
// Frequency: 0–1 representing the main action's frequency

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

export function getAllHands() {
  const hands = []
  RANKS.forEach(r => hands.push(r + r)) // Pairs
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i + 1; j < RANKS.length; j++) {
      hands.push(RANKS[i] + RANKS[j] + 's')
      hands.push(RANKS[i] + RANKS[j] + 'o')
    }
  }
  return hands
}

export function getHandKey(row, col) {
  if (row === col) return RANKS[row] + RANKS[row]
  if (row < col) return RANKS[row] + RANKS[col] + 's'
  return RANKS[col] + RANKS[row] + 'o'
}

export function getCombos(hand) {
  if (hand.length === 2) return 6          // pair
  if (hand.endsWith('s')) return 4          // suited
  return 12                                  // offsuit
}

export function getHandName(hand) {
  const rankNames = { A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: 'Ten',
    '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six', '5': 'Five',
    '4': 'Four', '3': 'Three', '2': 'Deuce' }
  if (hand.length === 2) return `Pocket ${rankNames[hand[0]]}s`
  const r1 = rankNames[hand[0]], r2 = rankNames[hand[1]]
  const type = hand.endsWith('s') ? 'Suited' : 'Offsuit'
  return `${r1}-${r2} ${type}`
}

// Build a complete 169-hand range from categorized inputs
function buildRange(raiseList, callList = [], mixedRF = {}, mixedRC = {}) {
  const all = getAllHands()
  const result = {}
  all.forEach(hand => {
    if (raiseList.includes(hand)) {
      result[hand] = { action: 'raise', frequency: 1.0 }
    } else if (callList.includes(hand)) {
      result[hand] = { action: 'call', frequency: 1.0 }
    } else if (mixedRC[hand] != null) {
      result[hand] = { action: 'mixed_rc', frequency: mixedRC[hand] }
    } else if (mixedRF[hand] != null) {
      result[hand] = { action: 'mixed_rf', frequency: mixedRF[hand] }
    } else {
      result[hand] = { action: 'fold', frequency: 0 }
    }
  })
  return result
}

// ─────────────────────────────────────────────
//  CASH GAME — 6-max — 100bb
// ─────────────────────────────────────────────

const cash100_UTG_RFI = buildRange(
  // Pure raise ~14%
  ['AA','KK','QQ','JJ','TT','99','88',
   'AKs','AQs','AJs','ATs',
   'KQs','KJs','KTs',
   'QJs','QTs',
   'JTs',
   'AKo','AQo'],
  [],
  // Mixed raise/fold
  { '77':0.65,'66':0.22,'A9s':0.55,'A5s':0.55,'A4s':0.30,
    'AJo':0.50,'K9s':0.35,'KQo':0.50,'T9s':0.45,'98s':0.15 },
  {}
)

const cash100_HJ_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77',
   'AKs','AQs','AJs','ATs','A9s',
   'A5s','A4s','A3s',
   'KQs','KJs','KTs','K9s',
   'QJs','QTs','Q9s',
   'JTs','J9s',
   'T9s','T8s',
   '98s','97s',
   '87s',
   'AKo','AQo','AJo','KQo'],
  [],
  { '66':0.75,'55':0.30,'44':0.10,
    'A8s':0.40,'A7s':0.15,'A2s':0.20,
    'ATo':0.55,'A9o':0.15,
    'K8s':0.30,'K7s':0.10,
    'KJo':0.55,'KTo':0.20,
    'Q8s':0.25,'QJo':0.25,'QTo':0.10,
    'J8s':0.20,'JTo':0.20,
    '96s':0.15,'86s':0.20,'76s':0.25,'65s':0.15 },
  {}
)

const cash100_CO_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s',
   'QJs','QTs','Q9s','Q8s',
   'JTs','J9s','J8s',
   'T9s','T8s','T7s',
   '98s','97s','96s',
   '87s','86s','85s',
   '76s','75s','74s',
   '65s','64s','63s',
   '54s','53s',
   'AKo','AQo','AJo','ATo',
   'KQo','KJo',
   'QJo'],
  [],
  { '44':0.55,'33':0.30,'22':0.20,
    'A9o':0.45,'A8o':0.20,
    'K6s':0.40,'K5s':0.20,'K4s':0.10,
    'KTo':0.55,'K9o':0.30,
    'Q7s':0.25,'Q6s':0.10,
    'QTo':0.40,'Q9o':0.20,
    'J7s':0.25,'J6s':0.10,
    'JTo':0.35,'J9o':0.20,
    'T6s':0.20,
    'T9o':0.25,
    '95s':0.20,'84s':0.15,'73s':0.10,'62s':0.10,'52s':0.15,'43s':0.25,'42s':0.10,'32s':0.20 },
  {}
)

const cash100_BTN_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s',
   'JTs','J9s','J8s','J7s','J6s','J5s',
   'T9s','T8s','T7s','T6s','T5s',
   '98s','97s','96s','95s','94s',
   '87s','86s','85s','84s','83s',
   '76s','75s','74s','73s',
   '65s','64s','63s','62s',
   '54s','53s','52s',
   '43s','42s',
   'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
   'KQo','KJo','KTo','K9o','K8o','K7o',
   'QJo','QTo','Q9o','Q8o',
   'JTo','J9o','J8o','J7o',
   'T9o','T8o','T7o',
   '98o','97o','96o',
   '87o','86o',
   '76o','75o',
   '65o'],
  [],
  { 'A6o':0.70,'A5o':0.60,'A4o':0.45,'A3o':0.30,'A2o':0.20,
    'Q3s':0.40,'Q2s':0.20,
    'J4s':0.40,'J3s':0.20,'J2s':0.10,
    'T4s':0.30,'T3s':0.15,'T2s':0.10,
    '93s':0.20,'92s':0.10,
    '82s':0.10,'72s':0.10,
    'K6o':0.55,'K5o':0.40,'K4o':0.25,'K3o':0.15,'K2o':0.10,
    'Q7o':0.55,'Q6o':0.40,'Q5o':0.30,'Q4o':0.20,'Q3o':0.10,
    'J6o':0.50,'J5o':0.35,'J4o':0.20,
    'T6o':0.40,'T5o':0.25,'T4o':0.15,
    '95o':0.30,'85o':0.25,'74o':0.25,'64o':0.20,'54o':0.30,'53o':0.20,'43o':0.20,'32s':0.40,'32o':0.10 },
  {}
)

const cash100_SB_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s',
   'JTs','J9s','J8s','J7s','J6s',
   'T9s','T8s','T7s','T6s',
   '98s','97s','96s','95s',
   '87s','86s','85s','84s',
   '76s','75s','74s','73s',
   '65s','64s','63s',
   '54s','53s','52s',
   '43s',
   'AKo','AQo','AJo','ATo','A9o','A8o',
   'KQo','KJo','KTo','K9o','K8o',
   'QJo','QTo','Q9o','Q8o',
   'JTo','J9o','J8o',
   'T9o','T8o',
   '98o','97o',
   '87o','86o',
   '76o'],
  [],
  { '33':0.65,'22':0.50,
    'A7o':0.55,'A6o':0.45,'A5o':0.35,
    'K7o':0.50,'K6o':0.35,'K5o':0.25,'K4o':0.15,'K3o':0.10,
    'Q7o':0.45,'Q6o':0.30,'Q5o':0.20,
    'J7o':0.40,'J6o':0.25,
    'T7o':0.35,'T6o':0.20,
    '96o':0.30,'95o':0.20,
    '85o':0.25,'75o':0.20,'74o':0.15,'64o':0.15,'53o':0.20,'42s':0.20,'32s':0.25 },
  {}
)

// BB Defense — call and 3-bet ranges vs different positions
const cash100_BB_vsBTN = buildRange(
  // 3-bet range
  ['AA','KK','QQ','JJ',
   'AKs','AQs','A5s','A4s',
   'AKo',
   'KQs'],
  // Call range
  ['TT','99','88','77','66','55','44','33','22',
   'AJs','ATs','A9s','A8s','A7s','A6s','A3s','A2s',
   'AQo','AJo','ATo','A9o','A8o','A7o','A6o',
   'KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
   'KQo','KJo','KTo','K9o','K8o',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s',
   'QJo','QTo','Q9o',
   'JTs','J9s','J8s','J7s','J6s',
   'JTo','J9o',
   'T9s','T8s','T7s','T6s',
   'T9o','T8o',
   '98s','97s','96s','95s',
   '98o','97o',
   '87s','86s','85s','84s',
   '87o',
   '76s','75s','74s',
   '65s','64s','63s',
   '54s','53s',
   '43s'],
  {},
  { 'KQo':0.40,'Q8s':0.50,'J8s':0.50,'T8s':0.50,'T7s':0.50 }
)

const cash100_BB_vsCO = buildRange(
  ['AA','KK','QQ','JJ','TT',
   'AKs','AQs','AJs','A5s','A4s',
   'AKo','AQo',
   'KQs','KJs'],
  ['99','88','77','66','55','44','33','22',
   'ATs','A9s','A8s','A7s','A6s','A3s','A2s',
   'AJo','ATo','A9o','A8o',
   'KTs','K9s','K8s','K7s','K6s','K5s','K4s',
   'KQo','KJo','KTo',
   'QJs','QTs','Q9s','Q8s','Q7s',
   'QJo','QTo',
   'JTs','J9s','J8s','J7s',
   'JTo',
   'T9s','T8s','T7s',
   'T9o',
   '98s','97s','96s',
   '87s','86s','85s',
   '76s','75s','74s',
   '65s','64s',
   '54s','53s'],
  {},
  { 'K9o':0.30,'Q9o':0.25,'J9o':0.20 }
)

const cash100_BB_vsUTG = buildRange(
  ['AA','KK','QQ',
   'AKs','AQs',
   'AKo'],
  ['JJ','TT','99','88','77',
   'AJs','ATs','A9s','A5s','A4s',
   'AQo','AJo',
   'KQs','KJs','KTs',
   'QJs','QTs',
   'JTs',
   'T9s','98s'],
  { '66':0.40,'55':0.20,'44':0.10,
    'A8s':0.40,'A7s':0.25,'A6s':0.20,'A3s':0.20,'A2s':0.15,
    'ATo':0.35,
    'K9s':0.35,'K8s':0.20,
    'KQo':0.30,
    'Q9s':0.25,'J9s':0.25,'87s':0.20,'76s':0.15,'65s':0.10 },
  {}
)

const cash100_BB_vsSB = buildRange(
  ['AA','KK','QQ','JJ','TT',
   'AKs','AQs','AJs','ATs','A9s','A5s','A4s','A3s',
   'AKo','AQo','AJo',
   'KQs','KJs','K5s','K4s',
   'QJs','Q5s','Q4s'],
  ['99','88','77','66','55','44','33','22',
   'A8s','A7s','A6s','A2s',
   'ATo','A9o','A8o','A7o','A6o','A5o',
   'KTs','K9s','K8s','K7s','K6s','K3s','K2s',
   'KQo','KTo','K9o','K8o','K7o',
   'QTs','Q9s','Q8s','Q7s','Q6s','Q3s','Q2s',
   'QTo','Q9o','Q8o',
   'JTs','J9s','J8s','J7s','J6s','J5s',
   'JTo','J9o','J8o',
   'T9s','T8s','T7s','T6s','T5s',
   'T9o','T8o','T7o',
   '98s','97s','96s','95s','94s',
   '98o','97o','96o',
   '87s','86s','85s','84s','83s',
   '87o','86o',
   '76s','75s','74s','73s',
   '76o','75o',
   '65s','64s','63s','62s',
   '54s','53s','52s','43s','42s','32s'],
  {},
  {}
)

// vs 3-bet ranges (after you open and face a 3-bet)
const cash100_BTN_vs3bet = buildRange(
  // 4-bet value
  ['AA','KK','QQ','AKs','AKo'],
  // Call 3-bet
  ['JJ','TT','AQs','AJs','KQs','QJs','JTs','T9s','AQo'],
  // Mixed 4-bet as bluff / sometimes call
  { 'A5s':0.60,'A4s':0.50,'A3s':0.40,'A2s':0.30,
    'KJs':0.30,'K9s':0.20,'99':0.35,'88':0.20 },
  {}
)

const cash100_CO_vs3bet = buildRange(
  ['AA','KK','AKs','AKo'],
  ['QQ','JJ','AQs','AJs','KQs','AQo','TT'],
  { 'A5s':0.55,'A4s':0.45,'A3s':0.30,'QJs':0.30,'JTs':0.25,'99':0.30 },
  {}
)

const cash100_HJ_vs3bet = buildRange(
  ['AA','KK','AKs','AKo'],
  ['QQ','JJ','AQs','AQo'],
  { 'A5s':0.45,'A4s':0.35,'TT':0.40,'AJs':0.40,'KQs':0.30 },
  {}
)

const cash100_UTG_vs3bet = buildRange(
  ['AA','KK','AKs','AKo'],
  ['QQ','JJ','AQs'],
  { 'TT':0.35,'AJs':0.30,'A5s':0.40 },
  {}
)

// SB vs BB — squeeze scenario
const cash100_SB_squeeze = buildRange(
  ['AA','KK','QQ','JJ','TT',
   'AKs','AQs','AJs','AKo','AQo','AJo',
   'KQs','KJs','A5s','A4s','A3s'],
  [],
  { '99':0.55,'88':0.40,'ATs':0.60,'KTs':0.40,'QJs':0.45,'ATo':0.40,'KQo':0.45 },
  {}
)

// ─────────────────────────────────────────────
//  MTT — 100bb (similar to cash, slightly tighter early)
// ─────────────────────────────────────────────

const mtt100_UTG_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88',
   'AKs','AQs','AJs','ATs',
   'KQs','KJs','KTs',
   'QJs','QTs','JTs',
   'AKo','AQo'],
  [],
  { '77':0.60,'66':0.20,'A9s':0.50,'A5s':0.50,'A4s':0.25,
    'AJo':0.45,'K9s':0.30,'KQo':0.45,'T9s':0.40 },
  {}
)

const mtt100_CO_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s',
   'KQs','KJs','KTs','K9s','K8s',
   'QJs','QTs','Q9s','Q8s',
   'JTs','J9s','J8s',
   'T9s','T8s','T7s',
   '98s','97s','96s',
   '87s','86s','76s','75s','65s','64s','54s',
   'AKo','AQo','AJo','ATo',
   'KQo','KJo','QJo'],
  [],
  { '44':0.50,'33':0.25,'22':0.15,'A6s':0.40,'A2s':0.25,
    'A9o':0.40,'A8o':0.20,
    'K7s':0.35,'KTo':0.45,'K9o':0.25,
    'QTo':0.35,'J7s':0.20,'JTo':0.30,
    'T6s':0.20,'85s':0.20,'74s':0.15,'63s':0.15,'53s':0.25,'43s':0.20,'32s':0.15 },
  {}
)

const mtt100_BTN_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s',
   'JTs','J9s','J8s','J7s','J6s','J5s',
   'T9s','T8s','T7s','T6s','T5s',
   '98s','97s','96s','95s','94s',
   '87s','86s','85s','84s',
   '76s','75s','74s','73s',
   '65s','64s','63s','54s','53s','43s',
   'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
   'KQo','KJo','KTo','K9o','K8o',
   'QJo','QTo','Q9o','Q8o',
   'JTo','J9o','J8o',
   'T9o','T8o','T7o',
   '98o','97o','87o','86o','76o'],
  [],
  { 'A6o':0.60,'A5o':0.50,'A4o':0.35,'A3o':0.25,'A2o':0.15,
    'K7o':0.40,'K6o':0.30,'K5o':0.20,'K4o':0.15,
    'Q7o':0.40,'Q6o':0.30,'Q5o':0.20,
    'J7o':0.35,'J6o':0.20,'T6o':0.25,'T5o':0.15,
    '96o':0.25,'85o':0.20,'75o':0.20,'65o':0.30,'54o':0.25 },
  {}
)

const mtt100_SB_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s',
   'JTs','J9s','J8s','J7s','J6s',
   'T9s','T8s','T7s','T6s',
   '98s','97s','96s','95s',
   '87s','86s','85s','76s','75s','65s','64s','54s','53s',
   'AKo','AQo','AJo','ATo','A9o','A8o',
   'KQo','KJo','KTo','K9o','K8o',
   'QJo','QTo','Q9o',
   'JTo','J9o','J8o',
   'T9o','T8o','98o','97o','87o'],
  [],
  { '33':0.60,'22':0.45,'A7o':0.50,'A6o':0.40,'A5o':0.30,
    'K7o':0.45,'K6o':0.30,'K5o':0.20,
    'Q8o':0.30,'Q7o':0.20,'J7o':0.30,'T7o':0.25,'96o':0.25,'86o':0.20,'76o':0.30,'75o':0.15,'65o':0.20 },
  {}
)

// ─────────────────────────────────────────────
//  MTT — 50bb (mixed: normal ranges + some push/fold)
// ─────────────────────────────────────────────

const mtt50_UTG_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77',
   'AKs','AQs','AJs','ATs','A9s',
   'KQs','KJs','KTs',
   'QJs','QTs','JTs',
   'AKo','AQo','AJo'],
  [],
  { '66':0.50,'55':0.20,'A8s':0.35,'A5s':0.55,'A4s':0.35,
    'ATo':0.40,'K9s':0.40,'KQo':0.55,'T9s':0.50,'98s':0.25 },
  {}
)

const mtt50_CO_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s',
   'QJs','QTs','Q9s','Q8s',
   'JTs','J9s','J8s','T9s','T8s','T7s',
   '98s','97s','96s','87s','86s','76s','75s','65s','54s',
   'AKo','AQo','AJo','ATo','A9o',
   'KQo','KJo','KTo','QJo'],
  [],
  { '33':0.40,'22':0.25,'A6s':0.45,'A6o':0.30,'A8o':0.25,
    'K7s':0.40,'K9o':0.30,'QTo':0.35,'JTo':0.30,'T6s':0.25,'85s':0.25,'74s':0.20,'64s':0.15,'53s':0.25,'43s':0.25 },
  {}
)

const mtt50_BTN_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s',
   'JTs','J9s','J8s','J7s','J6s','J5s',
   'T9s','T8s','T7s','T6s','T5s',
   '98s','97s','96s','95s','87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
   'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o',
   'KQo','KJo','KTo','K9o','K8o','K7o',
   'QJo','QTo','Q9o','Q8o','Q7o',
   'JTo','J9o','J8o','J7o',
   'T9o','T8o','T7o',
   '98o','97o','87o','86o','76o','75o','65o'],
  [],
  { 'A5o':0.55,'A4o':0.40,'A3o':0.25,'A2o':0.15,
    'K6o':0.35,'K5o':0.20,'K4o':0.15,
    'Q6o':0.30,'Q5o':0.20,'J6o':0.25,'T6o':0.25,'96o':0.25,'85o':0.20,'74o':0.20,'64o':0.15,'54o':0.25 },
  {}
)

const mtt50_SB_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s',
   'JTs','J9s','J8s','J7s','J6s',
   'T9s','T8s','T7s','T6s',
   '98s','97s','96s','87s','86s','85s','76s','75s','65s','64s','54s','53s',
   'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
   'KQo','KJo','KTo','K9o','K8o',
   'QJo','QTo','Q9o','Q8o',
   'JTo','J9o','J8o',
   'T9o','T8o',
   '98o','97o','87o','86o','76o'],
  [],
  { '22':0.55,'A6o':0.40,'A5o':0.30,'K7o':0.35,'K6o':0.25,'Q7o':0.30,'J7o':0.25,'T7o':0.20,'96o':0.20,'85o':0.15,'75o':0.20,'65o':0.25,'54o':0.20 },
  {}
)

// ─────────────────────────────────────────────
//  MTT — 25bb (primarily push/fold with some min-raise)
// ─────────────────────────────────────────────

const mtt25_UTG_RFI = buildRange(
  // Shove-worthy hands from UTG 25bb
  ['AA','KK','QQ','JJ','TT','99','88','77',
   'AKs','AQs','AJs','ATs','A9s','A8s',
   'KQs','KJs',
   'AKo','AQo','AJo'],
  [],
  { '66':0.70,'55':0.50,'A7s':0.50,'A5s':0.65,'A4s':0.50,'KTs':0.60,'ATo':0.55,'KQo':0.60,'QJs':0.50 },
  {}
)

const mtt25_CO_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s',
   'KQs','KJs','KTs','K9s',
   'QJs','QTs','Q9s',
   'JTs','J9s',
   'T9s','T8s','98s','87s',
   'AKo','AQo','AJo','ATo','A9o',
   'KQo','KJo','KTo'],
  [],
  { '44':0.65,'33':0.50,'22':0.35,
    'A3s':0.55,'A2s':0.40,'K8s':0.55,'K7s':0.40,'Q8s':0.45,'J8s':0.40,'76s':0.50,'65s':0.50,'54s':0.45,
    'A8o':0.55,'A7o':0.40,'QJo':0.55,'Q9o':0.30 },
  {}
)

const mtt25_BTN_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
   'QJs','QTs','Q9s','Q8s','Q7s','Q6s',
   'JTs','J9s','J8s','J7s','J6s',
   'T9s','T8s','T7s','T6s',
   '98s','97s','96s','87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
   'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o',
   'KQo','KJo','KTo','K9o','K8o','K7o',
   'QJo','QTo','Q9o','Q8o',
   'JTo','J9o','J8o','J7o',
   'T9o','T8o','T7o',
   '98o','97o','87o','86o','76o','65o'],
  [],
  { 'A4o':0.55,'A3o':0.40,'A2o':0.30,'K6o':0.35,'K5o':0.25,'Q7o':0.40,'Q6o':0.25,'J6o':0.30,'T6o':0.25,'54o':0.30,'75o':0.25,'64o':0.20,'53o':0.25 },
  {}
)

const mtt25_SB_RFI = buildRange(
  ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
   'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
   'KQs','KJs','KTs','K9s','K8s','K7s','K6s',
   'QJs','QTs','Q9s','Q8s','Q7s',
   'JTs','J9s','J8s','J7s',
   'T9s','T8s','T7s',
   '98s','97s','96s','87s','86s','76s','75s','65s','54s','53s',
   'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o',
   'KQo','KJo','KTo','K9o','K8o',
   'QJo','QTo','Q9o','Q8o',
   'JTo','J9o','J8o',
   'T9o','T8o',
   '98o','97o','87o','76o'],
  [],
  { 'A5o':0.50,'A4o':0.40,'A3o':0.30,'A2o':0.20,'K7o':0.40,'K6o':0.25,'Q6o':0.25,'J6o':0.25,'T6o':0.20,'96o':0.20,'85o':0.25,'74o':0.20,'64o':0.20,'65o':0.30,'54o':0.25 },
  {}
)

// ─────────────────────────────────────────────
//  EXPORT — Main ranges object
// ─────────────────────────────────────────────

export const ranges = {
  cash: {
    '100bb': {
      UTG: {
        RFI: cash100_UTG_RFI,
        vs3bet: cash100_UTG_vs3bet,
        vsOpenCall: cash100_BB_vsUTG,
        vsOpen3bet: buildRange(
          ['AA','KK','QQ','AKs','AKo'],
          ['JJ','TT','AQs'],
          { '99':0.30,'A5s':0.40,'A4s':0.30 }, {}
        ),
      },
      HJ: {
        RFI: cash100_HJ_RFI,
        vs3bet: cash100_HJ_vs3bet,
        vsOpenCall: cash100_BB_vsCO,
        vsOpen3bet: buildRange(
          ['AA','KK','QQ','AKs','AKo'],
          ['JJ','TT','AQs','AJs'],
          { '99':0.35,'A5s':0.45,'A4s':0.35,'KQs':0.25 }, {}
        ),
      },
      CO: {
        RFI: cash100_CO_RFI,
        vs3bet: cash100_CO_vs3bet,
        vsOpenCall: cash100_BB_vsCO,
        vsOpen3bet: buildRange(
          ['AA','KK','QQ','AKs','AKo'],
          ['JJ','TT','AQs','AJs','KQs'],
          { '99':0.40,'88':0.25,'A5s':0.55,'A4s':0.40,'QJs':0.25 }, {}
        ),
      },
      BTN: {
        RFI: cash100_BTN_RFI,
        vs3bet: cash100_BTN_vs3bet,
        vsOpenCall: cash100_BB_vsBTN,
        vsOpen3bet: buildRange(
          ['AA','KK','QQ','JJ','AKs','AKo'],
          ['TT','AQs','AJs','KQs','AQo'],
          { '99':0.45,'88':0.35,'A5s':0.65,'A4s':0.55,'A3s':0.40,'QJs':0.35,'JTs':0.25 }, {}
        ),
      },
      SB: {
        RFI: cash100_SB_RFI,
        vs3bet: buildRange(
          ['AA','KK','QQ','AKs','AKo'],
          ['JJ','TT','AQs','AJs'],
          { '99':0.35,'A5s':0.50,'A4s':0.40,'KQs':0.30 }, {}
        ),
        vsOpenCall: cash100_BB_vsSB,
        squeeze: cash100_SB_squeeze,
      },
      BB: {
        vsUTG: cash100_BB_vsUTG,
        vsHJ: cash100_BB_vsCO,
        vsCO: cash100_BB_vsCO,
        vsBTN: cash100_BB_vsBTN,
        vsSB: cash100_BB_vsSB,
        RFI: cash100_BB_vsBTN,
        vs3bet: buildRange(
          ['AA','KK','QQ','AKs','AKo'],
          ['JJ','TT','AQs'],
          { '99':0.30,'A5s':0.45 }, {}
        ),
        vsOpenCall: cash100_BB_vsBTN,
        vsOpen3bet: buildRange(
          ['AA','KK','QQ','AKs','AKo'],
          ['JJ','TT','AQs'],
          { 'A5s':0.50 }, {}
        ),
      },
    },
  },
  mtt: {
    '100bb': {
      UTG: { RFI: mtt100_UTG_RFI, vs3bet: cash100_UTG_vs3bet, vsOpenCall: cash100_BB_vsUTG, vsOpen3bet: cash100_CO_vs3bet },
      HJ:  { RFI: cash100_HJ_RFI, vs3bet: cash100_HJ_vs3bet, vsOpenCall: cash100_BB_vsCO, vsOpen3bet: cash100_CO_vs3bet },
      CO:  { RFI: mtt100_CO_RFI, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsCO, vsOpen3bet: cash100_BTN_vs3bet },
      BTN: { RFI: mtt100_BTN_RFI, vs3bet: cash100_BTN_vs3bet, vsOpenCall: cash100_BB_vsBTN, vsOpen3bet: cash100_BTN_vs3bet },
      SB:  { RFI: mtt100_SB_RFI, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsSB, vsOpen3bet: cash100_BTN_vs3bet },
      BB:  { RFI: cash100_BB_vsBTN, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsBTN, vsOpen3bet: cash100_CO_vs3bet, vsBTN: cash100_BB_vsBTN, vsSB: cash100_BB_vsSB, vsCO: cash100_BB_vsCO, vsHJ: cash100_BB_vsCO, vsUTG: cash100_BB_vsUTG },
    },
    '50bb': {
      UTG: { RFI: mtt50_UTG_RFI, vs3bet: cash100_UTG_vs3bet, vsOpenCall: cash100_BB_vsUTG, vsOpen3bet: cash100_UTG_vs3bet },
      HJ:  { RFI: mtt50_UTG_RFI, vs3bet: cash100_HJ_vs3bet, vsOpenCall: cash100_BB_vsCO, vsOpen3bet: cash100_HJ_vs3bet },
      CO:  { RFI: mtt50_CO_RFI, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsCO, vsOpen3bet: cash100_CO_vs3bet },
      BTN: { RFI: mtt50_BTN_RFI, vs3bet: cash100_BTN_vs3bet, vsOpenCall: cash100_BB_vsBTN, vsOpen3bet: cash100_BTN_vs3bet },
      SB:  { RFI: mtt50_SB_RFI, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsSB, vsOpen3bet: cash100_CO_vs3bet },
      BB:  { RFI: cash100_BB_vsBTN, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsBTN, vsOpen3bet: cash100_CO_vs3bet, vsBTN: cash100_BB_vsBTN, vsSB: cash100_BB_vsSB, vsCO: cash100_BB_vsCO, vsHJ: cash100_BB_vsCO, vsUTG: cash100_BB_vsUTG },
    },
    '25bb': {
      UTG: { RFI: mtt25_UTG_RFI, vs3bet: cash100_UTG_vs3bet, vsOpenCall: cash100_BB_vsUTG, vsOpen3bet: cash100_UTG_vs3bet },
      HJ:  { RFI: mtt25_UTG_RFI, vs3bet: cash100_HJ_vs3bet, vsOpenCall: cash100_BB_vsCO, vsOpen3bet: cash100_HJ_vs3bet },
      CO:  { RFI: mtt25_CO_RFI, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsCO, vsOpen3bet: cash100_CO_vs3bet },
      BTN: { RFI: mtt25_BTN_RFI, vs3bet: cash100_BTN_vs3bet, vsOpenCall: cash100_BB_vsBTN, vsOpen3bet: cash100_BTN_vs3bet },
      SB:  { RFI: mtt25_SB_RFI, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsSB, vsOpen3bet: cash100_CO_vs3bet },
      BB:  { RFI: cash100_BB_vsBTN, vs3bet: cash100_CO_vs3bet, vsOpenCall: cash100_BB_vsBTN, vsOpen3bet: cash100_CO_vs3bet, vsBTN: cash100_BB_vsBTN, vsSB: cash100_BB_vsSB, vsCO: cash100_BB_vsCO, vsHJ: cash100_BB_vsCO, vsUTG: cash100_BB_vsUTG },
    },
  },
}

export const ACTION_COLORS = {
  raise:    '#C9A84C',
  call:     '#3498DB',
  mixed_rf: '#E67E22',
  mixed_rc: '#9B59B6',
  fold:     '#1E1E2C',
}

export const ACTION_LABELS = {
  raise:    'Raise',
  call:     'Call',
  mixed_rf: 'Mixed Raise/Fold',
  mixed_rc: 'Mixed Raise/Call',
  fold:     'Fold',
}

export const POSITIONS_6MAX = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']

export const SITUATIONS_BY_POSITION = {
  UTG: ['RFI', 'vs3bet', 'vsOpenCall', 'vsOpen3bet'],
  HJ:  ['RFI', 'vs3bet', 'vsOpenCall', 'vsOpen3bet'],
  CO:  ['RFI', 'vs3bet', 'vsOpenCall', 'vsOpen3bet'],
  BTN: ['RFI', 'vs3bet', 'vsOpenCall', 'vsOpen3bet'],
  SB:  ['RFI', 'vs3bet', 'vsOpenCall', 'squeeze'],
  BB:  ['vsBTN', 'vsSB', 'vsCO', 'vsHJ', 'vsUTG'],
}

export const SITUATION_LABELS = {
  RFI:        'RFI — Open',
  vs3bet:     'vs 3-Bet',
  vsOpenCall: 'vs Open (Call)',
  vsOpen3bet: 'vs Open (3-Bet)',
  squeeze:    'Squeeze',
  vsBTN:      'vs BTN Open',
  vsSB:       'vs SB Open',
  vsCO:       'vs CO Open',
  vsHJ:       'vs HJ Open',
  vsUTG:      'vs UTG Open',
}
