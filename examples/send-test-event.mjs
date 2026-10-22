// Sends your receiver a signed test event, the way INITE signs a delivery.
// Node.js 18+, no dependencies.
//
//   INITE_WEBHOOK_SECRET=whsec_... node send-test-event.mjs http://localhost:8787/ [options]
//
//   --event facts.confirmed | content.approved   which event (default facts.confirmed)
//   --id evt_...                                 the event id (default: a new one; repeat it to test dedup)
//   --stale                                      sign it ten minutes ago: a receiver must refuse it
//   --tamper                                     change the body after signing: a receiver must refuse it
//
// Prints the status your receiver answered. The payloads are the documented
// examples (https://inite.ai/en/mcp#site-api) for a made-up company.

import { createHmac, randomBytes } from 'node:crypto'

const args = process.argv.slice(2)
const url = args.find((a) => /^https?:\/\//.test(a))
const opt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const secret = process.env.INITE_WEBHOOK_SECRET
if (!url || !secret) {
  console.error('usage: INITE_WEBHOOK_SECRET=whsec_... node send-test-event.mjs <receiver url> [--event facts.confirmed|content.approved] [--id evt_...] [--stale] [--tamper]')
  process.exit(2)
}

/** The header INITE sends: t, and the HMAC-SHA256 of "<t>.<body>" keyed with the whole secret. */
export function signatureHeader(secret, body, t) {
  return `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`
}

const event = opt('event') ?? 'facts.confirmed'
const id = opt('id') ?? `evt_${randomBytes(18).toString('base64url')}`
const article = {
  id: 'cm2y0v7ka0004',
  lang: 'en',
  title: 'How much does a dental cleaning cost in Austin?',
  slug: 'dental-cleaning-cost-austin',
  metaDescription: 'What a cleaning costs at Acme Dental, what it includes, and when insurance covers it.',
  body: '## What a cleaning includes\n\nA cleaning at Acme Dental takes about 45 minutes…',
  html: '<h2>What a cleaning includes</h2>\n<p>A cleaning at Acme Dental takes about 45 minutes…</p>\n',
  sources: [{ url: 'https://www.ada.org/resources/research/health-policy-institute', title: 'ADA Health Policy Institute' }],
  approvedAt: '2026-10-22T09:30:00.000Z',
}
const payloads = {
  'facts.confirmed': {
    id,
    event: 'facts.confirmed',
    site: 'acme.com',
    slug: 'acme',
    version: 4,
    confirmedAt: '2026-10-22T10:00:00.000Z',
    manifestUrl: 'https://inite.ai/api/site/v1/manifest',
    factsUrl: 'https://inite.ai/api/site/v1/public/acme?d=acme.com',
  },
  'content.approved': {
    id,
    event: 'content.approved',
    site: 'acme.com',
    slug: 'acme',
    article,
    report: {
      published: `https://inite.ai/api/site/v1/content/${article.id}/published`,
      failed: `https://inite.ai/api/site/v1/content/${article.id}/failed`,
    },
  },
}
if (!payloads[event]) {
  console.error(`unknown event ${event}`)
  process.exit(2)
}

const body = JSON.stringify(payloads[event])
const t = Math.floor(Date.now() / 1000) - (args.includes('--stale') ? 600 : 0)
const signature = signatureHeader(secret, body, t)
const sent = args.includes('--tamper') ? body.replace('acme.com', 'evil.example') : body

const res = await fetch(url, {
  method: 'POST',
  redirect: 'manual',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'INITE-Webhooks/1.0 (+https://inite.ai/en/mcp#site-api)',
    'INITE-Event': event,
    'INITE-Webhook-Id': id,
    'INITE-Signature': signature,
  },
  body: sent,
})
console.log(`${res.status} ${(await res.text()).trim()}  (${event}, ${id})`)
