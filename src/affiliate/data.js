// Affiliate room data — replace placeholder URLs with real tracking links before deploying

export const ROOMS = [
  {
    id: 'ggpoker',
    name: 'GGPoker',
    tagline: 'El mayor ecosistema de póker del mundo',
    description:
      'Software GGNetwork, el más completo del mercado. Herramientas integradas: EV Advisor, hand replayer, estadísticas en tiempo real.',
    bonus: 'Hasta $600 de bienvenida',
    bonusDetail: 'Bonus 100% primer depósito hasta $600 · liberación gradual',
    badge: 'Recomendado',
    badgeColor: '#C9A84C',
    cta: 'Jugar en GGPoker',
    // ⚠️ Replace with your real affiliate tracking URL
    affiliateUrl: 'https://ggpoker.es',
    color: '#2ECC71',
    colorBg: 'rgba(46,204,113,0.08)',
    colorBorder: 'rgba(46,204,113,0.25)',
    stats: { software: 5, traffic: 5, rakePct: '4.5–5%', bonusAmount: '$600' },
    pros: ['Software líder del mercado', 'Máximo tráfico cash y MTT', 'Herramientas de HUD integradas', 'Bonos frecuentes para regulares'],
    cons: ['Rake algo elevado en micros', 'Curva de aprendizaje del software'],
    bestFor: 'Jugadores de todos los niveles que quieren el mejor software',
    featured: true,
  },
  {
    id: 'pokerstars',
    name: 'PokerStars',
    tagline: 'La sala más reconocida del mundo',
    description:
      'Imbatible en torneos MTT. La Sunday Million y los torneos de serie son imprescindibles. App móvil de referencia en el sector.',
    bonus: 'Bonus 100% hasta $600',
    bonusDetail: 'Bonus 100% primer depósito hasta $600 · en SpinCoins',
    badge: null,
    cta: 'Jugar en PokerStars',
    // ⚠️ Replace with your real affiliate tracking URL
    affiliateUrl: 'https://pokerstars.es',
    color: '#E8734A',
    colorBg: 'rgba(232,115,74,0.08)',
    colorBorder: 'rgba(232,115,74,0.25)',
    stats: { software: 4, traffic: 5, rakePct: '4.5–5%', bonusAmount: '$600' },
    pros: ['Mayor volumen MTT del mundo', 'App móvil excelente', 'Estructura de torneos imbatible', 'MicroStakes muy activos'],
    cons: ['Competencia más dura en cash', 'Rakeback menos competitivo'],
    bestFor: 'Jugadores orientados a torneos MTT',
    featured: false,
  },
  {
    id: '888poker',
    name: '888poker',
    tagline: 'Empieza gratis, sin depósito',
    description:
      'La mejor opción para comenzar sin riesgo. $88 sin depósito para explorar la sala, probar las mesas y practicar con dinero real.',
    bonus: '$88 gratis sin depósito',
    bonusDetail: '$88 sin depósito + 100% primer depósito hasta $400',
    badge: 'Sin depósito',
    badgeColor: '#2ECC71',
    cta: 'Reclamar $88 gratis',
    // ⚠️ Replace with your real affiliate tracking URL
    affiliateUrl: 'https://888poker.es',
    color: '#E74C3C',
    colorBg: 'rgba(231,76,60,0.08)',
    colorBorder: 'rgba(231,76,60,0.25)',
    stats: { software: 3, traffic: 3, rakePct: '4–5%', bonusAmount: '$88 SD' },
    pros: ['$88 sin depósito requerido', 'Ideal para primeros pasos', 'Buen tráfico europeo casual', 'Mesas de bajo rake en inicio'],
    cons: ['Menos tráfico que Stars/GG', 'Software más básico'],
    bestFor: 'Principiantes que quieren empezar sin riesgo',
    featured: false,
  },
]

export const PRIMARY_ROOM = ROOMS.find(r => r.featured) ?? ROOMS[0]

// Stars (★) rating helper
export function stars(n, max = 5) {
  return '★'.repeat(n) + '☆'.repeat(max - n)
}
