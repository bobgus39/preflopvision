import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function LoginModal() {
  const { loginOpen, closeLogin, loginFromStripe, openPricing } = useAuth()

  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  function reset() {
    setEmail('')
    setStatus('idle')
    setErrorMsg('')
  }

  function handleClose() {
    closeLogin()
    setTimeout(reset, 300)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@')) {
      setErrorMsg('Introduce un email válido.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res  = await fetch(`/api/subscription?email=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (data.isPro) {
        loginFromStripe(trimmed, data.expiresAt)
        setStatus('success')
        setTimeout(handleClose, 2200)
      } else {
        setErrorMsg(
          data.status === 'no_db'
            ? 'Servicio temporalmente no disponible. Inténtalo más tarde.'
            : 'No encontramos una suscripción Pro activa con ese email.'
        )
        setStatus('idle')
      }
    } catch {
      setErrorMsg('Error de conexión. Comprueba tu red e inténtalo de nuevo.')
      setStatus('idle')
    }
  }

  function handleGoToPricing() {
    handleClose()
    setTimeout(() => openPricing(), 300)
  }

  return (
    <AnimatePresence>
      {loginOpen && (
        <motion.div
          key="login-backdrop"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="rounded-2xl border border-gold/20 p-8"
              style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #0d0d18 100%)' }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-cream-muted hover:text-cream transition-colors text-lg leading-none"
                aria-label="Cerrar"
              >
                ✕
              </button>

              {/* Success state */}
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="text-4xl mb-4">✦</div>
                    <h2 className="font-display text-xl font-bold gold-text mb-2">
                      ¡Bienvenido de vuelta!
                    </h2>
                    <p className="text-cream-dim text-sm">
                      Sesión Pro restaurada correctamente.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="text-3xl mb-3">🃏</div>
                      <h2 className="font-display text-xl font-bold gold-text mb-1">
                        Iniciar sesión
                      </h2>
                      <p className="text-cream-dim text-sm leading-relaxed">
                        Introduce tu email para restaurar<br />tu sesión Pro.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs text-cream-dim mb-1.5 font-semibold tracking-wide uppercase">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          autoFocus
                          disabled={status === 'loading'}
                          className="w-full px-4 py-3 rounded-xl bg-surface border border-gold/20 text-cream placeholder-cream-muted/40 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all disabled:opacity-50"
                        />
                        <AnimatePresence>
                          {errorMsg && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-2 text-xs text-red-400"
                            >
                              {errorMsg}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={status === 'loading' || !email.trim()}
                        className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #C9A84C 0%, #E8C76B 100%)',
                          color: '#0D0D12',
                        }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {status === 'loading' ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="inline-block w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full"
                            />
                            Verificando…
                          </span>
                        ) : (
                          'Acceder →'
                        )}
                      </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-5 text-center">
                      <p className="text-xs text-cream-muted">
                        ¿Aún no eres Pro?{' '}
                        <button
                          type="button"
                          onClick={handleGoToPricing}
                          className="text-gold hover:text-gold/80 underline underline-offset-2 transition-colors"
                        >
                          Ver planes →
                        </button>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
