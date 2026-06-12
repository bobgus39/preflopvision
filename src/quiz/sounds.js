// Lightweight sound effects via Web Audio API — no external dependency
// All sounds triggered only from user-gesture handlers, so autoplay policy is safe.

function tone({ freq1, freq2 = null, dur, type = 'sine', vol = 0.14 }) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq1, ctx.currentTime)
    if (freq2 != null) {
      osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + dur * 0.55)
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur)
    // GC the context after the sound finishes
    setTimeout(() => ctx.close(), (dur + 0.2) * 1000)
  } catch {
    // AudioContext not available (SSR, restricted environments) — silent fallback
  }
}

export const playCorrect = () => tone({ freq1: 660, freq2: 880,  dur: 0.22 })
export const playWrong   = () => tone({ freq1: 280, freq2: 180,  dur: 0.30, type: 'sawtooth', vol: 0.09 })
export const playStreak  = () => tone({ freq1: 880, freq2: 1320, dur: 0.38, vol: 0.16 })
