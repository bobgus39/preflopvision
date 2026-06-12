import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, upsertSubscription, updateSubscriptionById, getSubscriptionByEmail, hasDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IS_PROD   = process.env.NODE_ENV === 'production'

// ─── Validate env ─────────────────────────────────────────────────────────────

const REQUIRED = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_YEARLY']
const missing  = REQUIRED.filter(k => !process.env[k])
if (missing.length) {
  console.warn(`⚠  Missing env vars: ${missing.join(', ')}`)
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

// Plan lookup by Stripe price ID
const PLAN_BY_PRICE = Object.fromEntries(
  Object.entries(PRICE_IDS).map(([plan, priceId]) => [priceId, plan])
)

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: [FRONTEND, 'http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
}))

// Webhook MUST be registered before express.json() to preserve raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook)

app.use(express.json())

// ─── POST /api/create-checkout-session ───────────────────────────────────────

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
      success_url: `${FRONTEND}/#/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${FRONTEND}/#/pricing`,
      metadata:    { app: 'preflop-vision', plan },
      allow_promotion_codes: true,
    }

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
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const email   = session.customer_details?.email ?? session.customer_email
        if (!email) { console.warn('[webhook] checkout.completed — no email'); break }

        // Retrieve full subscription to get period end
        const subId = session.subscription
        let plan    = session.metadata?.plan ?? 'monthly'
        let periodEnd = null

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          periodEnd = new Date(sub.current_period_end * 1000)
          // Determine plan from price ID if not in metadata
          const priceId = sub.items?.data?.[0]?.price?.id
          if (priceId && PLAN_BY_PRICE[priceId]) plan = PLAN_BY_PRICE[priceId]
        }

        await upsertSubscription({
          email,
          stripeCustomerId:     session.customer,
          stripeSubscriptionId: subId,
          plan,
          status:           'active',
          currentPeriodEnd: periodEnd,
        })
        console.log(`[webhook] ✅ checkout.completed — ${email} → Pro (${plan})`)
        break
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object
        const status  = sub.status   // 'active' | 'past_due' | 'canceled' | 'trialing' etc.
        const periodEnd = new Date(sub.current_period_end * 1000)

        await updateSubscriptionById({
          stripeSubscriptionId: sub.id,
          status,
          currentPeriodEnd: periodEnd,
        })
        console.log(`[webhook] subscription.updated — ${sub.id} → ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await updateSubscriptionById({
          stripeSubscriptionId: sub.id,
          status:           'canceled',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        })
        console.log(`[webhook] subscription.deleted — ${sub.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object
        if (inv.subscription) {
          await updateSubscriptionById({
            stripeSubscriptionId: inv.subscription,
            status: 'past_due',
            currentPeriodEnd: null,
          })
        }
        console.log(`[webhook] invoice.payment_failed — ${inv.id}`)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err.message)
  }

  res.json({ received: true })
}

// ─── GET /api/subscription ────────────────────────────────────────────────────
// Returns current Pro status for a given email — used by frontend on each session start

app.get('/api/subscription', async (req, res) => {
  const { email } = req.query
  if (!email?.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  // If no DB, fall through to localStorage-only mode on the client
  if (!hasDb()) {
    return res.json({ isPro: false, plan: 'free', status: 'no_db', expiresAt: null })
  }

  try {
    const sub = await getSubscriptionByEmail(email.toLowerCase())

    if (!sub) {
      return res.json({ isPro: false, plan: 'free', status: 'not_found', expiresAt: null })
    }

    const isActive = sub.status === 'active' || sub.status === 'trialing'
    const isPro    = isActive && (!sub.current_period_end || new Date(sub.current_period_end) > new Date())

    res.json({
      isPro,
      plan:      isPro ? sub.plan : 'free',
      status:    sub.status,
      expiresAt: sub.current_period_end ? new Date(sub.current_period_end).getTime() : null,
    })
  } catch (err) {
    console.error('[subscription]', err.message)
    res.status(500).json({ error: err.message })
  }
})

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

    const paid = session.payment_status === 'paid' || session.status === 'complete'
    if (!paid) {
      return res.json({ success: false, error: 'Payment not completed' })
    }

    const email = session.customer_details?.email ?? session.customer_email ?? null
    const plan  = session.metadata?.plan ?? 'monthly'
    const sub   = session.subscription

    const expiresAt = sub?.current_period_end
      ? sub.current_period_end * 1000
      : Date.now() + 30 * 24 * 60 * 60 * 1000

    res.json({ success: true, email, plan, expiresAt })
  } catch (err) {
    console.error('[verify-session]', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now(), db: hasDb() })
})

// ─── Static frontend (production) ─────────────────────────────────────────────

if (IS_PROD) {
  const distDir = path.join(__dirname, '../dist')
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

// ─── Start ────────────────────────────────────────────────────────────────────

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Preflop Vision API running on http://localhost:${PORT}`)
    console.log(`   FRONTEND_URL = ${FRONTEND}`)
    console.log(`   Database     = ${hasDb() ? 'connected' : 'disabled (no DATABASE_URL)'}`)
    if (IS_PROD) console.log(`   Serving static frontend from dist/`)
  })
})
