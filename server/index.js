import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IS_PROD   = process.env.NODE_ENV === 'production'

// ─── Validate env ────────────────────────────────────────────────────────────

const REQUIRED = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_YEARLY']
const missing  = REQUIRED.filter(k => !process.env[k])
if (missing.length) {
  console.warn(`⚠  Missing env vars: ${missing.join(', ')}`)
  console.warn('   Copy server/.env.example → server/.env and fill in the values.')
}

// ─── Init ─────────────────────────────────────────────────────────────────────

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder')
const app      = express()
const PORT     = process.env.PORT ?? 3001
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly:  process.env.STRIPE_PRICE_YEARLY,
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: [FRONTEND, 'http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
}))

// Webhook MUST be registered before express.json() to preserve raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook)

app.use(express.json())

// ─── POST /api/create-checkout-session ────────────────────────────────────────

app.post('/api/create-checkout-session', async (req, res) => {
  const { plan = 'monthly', email } = req.body

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return res.status(400).json({ error: `Unknown plan: ${plan}` })
  }

  try {
    const params = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // HashRouter URL: /#/success?session_id=...
      success_url: `${FRONTEND}/#/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${FRONTEND}/#/pricing`,
      metadata:    { app: 'preflop-vision', plan },
      allow_promotion_codes: true,
    }

    // Pre-fill email if provided
    if (email?.includes('@')) params.customer_email = email

    const session = await stripe.checkout.sessions.create(params)
    res.json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout-session]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/webhook ────────────────────────────────────────────────────────

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('[webhook] Signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const email   = session.customer_details?.email ?? session.customer_email
      console.log(`[webhook] Payment completed — session=${session.id} email=${email}`)
      // Production: upsert user in DB, send welcome email, etc.
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      console.log(`[webhook] Subscription updated — id=${sub.id} status=${sub.status}`)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      console.log(`[webhook] Subscription cancelled — id=${sub.id}`)
      // Production: downgrade user to free in DB
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object
      console.log(`[webhook] Payment failed — invoice=${inv.id}`)
      // Production: send dunning email to inv.customer_email
      break
    }

    default:
      // Silently ignore unhandled events
      break
  }

  // Always respond 200 to prevent Stripe retries
  res.json({ received: true })
}

// ─── GET /api/verify-session/:sessionId ──────────────────────────────────────

app.get('/api/verify-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params

  if (!sessionId?.startsWith('cs_')) {
    return res.status(400).json({ success: false, error: 'Invalid session ID' })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    // Session must be paid / complete
    const paid = session.payment_status === 'paid' || session.status === 'complete'
    if (!paid) {
      return res.json({ success: false, error: 'Payment not completed' })
    }

    const email = session.customer_details?.email ?? session.customer_email ?? null
    const plan  = session.metadata?.plan ?? 'monthly'
    const sub   = session.subscription

    // Use Stripe subscription's actual period end; fall back to 30 days
    const expiresAt = sub?.current_period_end
      ? sub.current_period_end * 1000          // Stripe returns UNIX seconds
      : Date.now() + 30 * 24 * 60 * 60 * 1000

    res.json({ success: true, email, plan, expiresAt })
  } catch (err) {
    console.error('[verify-session]', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

// ─── Static frontend (production) ─────────────────────────────────────────────

if (IS_PROD) {
  const distDir = path.join(__dirname, '../dist')
  app.use(express.static(distDir))
  // SPA fallback — HashRouter handles all client-side routing
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Preflop Vision API running on http://localhost:${PORT}`)
  console.log(`   FRONTEND_URL = ${FRONTEND}`)
  if (IS_PROD) console.log(`   Serving static frontend from dist/`)
})
