// INITE Agents webhook receiver for Node.js 18+, no dependencies.
//
//   INITE_WEBHOOK_SECRET=whsec_... node receiver.mjs
//
// Listens on PORT (default 8787) and accepts POSTs on any path. Every
// delivery is checked before its body is trusted:
//
//   INITE-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>
//
// The HMAC is computed over the raw bytes received, never a re-serialised
// object. A t more than five minutes from now is refused. INITE-Webhook-Id
// is the same on every retry of one event, so a repeat is acknowledged and
// dropped. Answer 2xx within ten seconds; anything else is retried after 1,
// 5, 30, 120 and 360 minutes.

import { createServer } from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const TOLERANCE_S = 300
const MAX_BODY = 1024 * 1024
const INITE_ORIGIN = 'https://inite.ai'

/**
 * True when one of the header's v1 signatures matches the raw body and t is
 * within five minutes of now. `rawBody` is a Buffer or a string.
 */
export function verifySignature(rawBody, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (!secret || !header) return false
  let t = NaN
  const signatures = []
  for (const part of String(header).split(',')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const key = part.slice(0, i).trim()
    const value = part.slice(i + 1).trim()
    if (key === 't') t = Number(value)
    else if (key === 'v1' && value) signatures.push(value)
  }
  if (!Number.isInteger(t) || Math.abs(now - t) > TOLERANCE_S) return false
  const want = Buffer.from(createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest('hex'))
  return signatures.some((v) => {
    const got = Buffer.from(v)
    return got.length === want.length && timingSafeEqual(got, want)
  })
}

// Event ids already handled. In memory for the example; keep them in your
// database in production, so a retry after a restart is still dropped.
const seen = new Set()
function firstTime(id) {
  if (seen.has(id)) return false
  seen.add(id)
  if (seen.size > 10_000) seen.delete(seen.values().next().value)
  return true
}

/**
 * Tell INITE where an approved article was published. The address is built
 * here from the article id, never taken from the payload, so the site key
 * only ever goes to inite.ai.
 */
export async function reportPublished(articleId, url, siteKey = process.env.INITE_SITE_KEY) {
  const res = await fetch(`${INITE_ORIGIN}/api/site/v1/content/${encodeURIComponent(articleId)}/published`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${siteKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    redirect: 'manual',
  })
  return res.status
}

async function handle(event) {
  switch (event.event) {
    case 'facts.confirmed':
      // A new version of the facts. Rebuild or refresh whatever serves them:
      // fetch the manifest with your site key, or just log it.
      console.log(`facts.confirmed: ${event.site} is at version ${event.version} (${event.confirmedAt})`)
      break
    case 'content.approved':
      // The article exactly as the owner approved it: title, slug,
      // metaDescription, body (Markdown), html, lang, sources.
      console.log(`content.approved: "${event.article.title}" for ${event.site}`)
      // const url = await createPostInYourCms(event.article)
      // await reportPublished(event.article.id, url)
      break
    default:
      console.log(`ignored event ${event.event}`)
  }
}

export function createReceiver(secret) {
  return createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' }).end()
      return
    }
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) req.destroy()
      else chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks)
      if (!verifySignature(raw, req.headers['inite-signature'], secret)) {
        res.writeHead(401).end('bad signature\n')
        return
      }
      let event
      try {
        event = JSON.parse(raw.toString('utf8'))
      } catch {
        res.writeHead(400).end('bad json\n')
        return
      }
      const id = req.headers['inite-webhook-id'] || event.id
      if (!firstTime(id)) {
        res.writeHead(200).end('already handled\n')
        return
      }
      // Acknowledge first; do the slow work (a CMS call) after the answer.
      res.writeHead(200).end('ok\n')
      handle(event).catch((err) => console.error('handling failed:', err))
    })
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const secret = process.env.INITE_WEBHOOK_SECRET
  if (!secret) {
    console.error('Set INITE_WEBHOOK_SECRET to the secret the cabinet showed when you added the address.')
    process.exit(1)
  }
  const port = Number(process.env.PORT || 8787)
  createReceiver(secret).listen(port, () => console.log(`listening on http://localhost:${port}`))
}
