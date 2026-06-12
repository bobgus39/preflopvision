import pg from 'pg'

const { Pool } = pg

let pool = null

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) return null
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
    })
    pool.on('error', (err) => console.error('[db] Unexpected pool error:', err.message))
  }
  return pool
}

export function hasDb() {
  return !!process.env.DATABASE_URL
}

export async function initDb() {
  const p = getPool()
  if (!p) {
    console.warn('⚠  DATABASE_URL not set — subscription persistence disabled')
    return
  }

  await p.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      email                  TEXT PRIMARY KEY,
      stripe_customer_id     TEXT,
      stripe_subscription_id TEXT,
      plan                   TEXT    NOT NULL DEFAULT 'free',
      status                 TEXT    NOT NULL DEFAULT 'free',
      current_period_end     TIMESTAMPTZ,
      updated_at             TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_sub_customer
      ON subscriptions(stripe_customer_id)
  `)

  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_sub_subscription
      ON subscriptions(stripe_subscription_id)
  `)

  console.log('✅ Database ready')
}

// Insert or update by email (used on checkout.session.completed)
export async function upsertSubscription({ email, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd }) {
  const p = getPool()
  if (!p) return

  await p.query(`
    INSERT INTO subscriptions
      (email, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (email) DO UPDATE SET
      stripe_customer_id     = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      plan                   = EXCLUDED.plan,
      status                 = EXCLUDED.status,
      current_period_end     = EXCLUDED.current_period_end,
      updated_at             = NOW()
  `, [email, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd])
}

// Update status + period by subscription ID (used on subscription.updated / deleted)
export async function updateSubscriptionById({ stripeSubscriptionId, status, currentPeriodEnd }) {
  const p = getPool()
  if (!p) return

  await p.query(`
    UPDATE subscriptions
       SET status             = $1,
           current_period_end = $2,
           updated_at         = NOW()
     WHERE stripe_subscription_id = $3
  `, [status, currentPeriodEnd, stripeSubscriptionId])
}

// Look up a subscription by email — returns null if not found
export async function getSubscriptionByEmail(email) {
  const p = getPool()
  if (!p) return null

  const { rows } = await p.query(
    'SELECT * FROM subscriptions WHERE email = $1',
    [email]
  )
  return rows[0] ?? null
}
