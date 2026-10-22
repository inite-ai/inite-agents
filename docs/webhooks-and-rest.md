# Webhooks and REST

For a site on any stack: call the connector API with a site key, and listen for two signed webhook events. The reference, always current, is **https://inite.ai/en/mcp#site-api**. This page is the short version, plus working receivers in [`examples/`](../examples/).

## The site key

In the [INITE cabinet](https://inite.ai/en/profile?tab=agents), open **For agents** and make a site key for the **Webhook** platform. It starts with `isk_` and is shown once. Send it as `Authorization: Bearer isk_…`, and only to `https://inite.ai`.

The site-key endpoints take 60 requests a minute from one IP address. The public facts take 30 a minute. Over the limit the answer is `429` with `Retry-After`.

## Endpoints

| Method and path | Key | What |
|---|---|---|
| `GET /api/site/v1/manifest` | site key | Which files to serve and where, the head tags, the MCP address, the facts version. Send `If-None-Match`; `304` means nothing changed. Every five minutes is enough. |
| `GET /api/site/v1/files/{name}` | site key | One file, byte for byte, with its content type: `llms.txt`, `agent-card.json`, `mcp.json`, `api-catalog`, `robots-signal` or `jsonld`. |
| `POST /api/site/v1/ping` | site key | Optional, about once a day: your platform, version, paths served and AI agent read counts. |
| `GET /api/site/v1/content/queue` | site key | Approved articles not yet published on this site, oldest first, ten at most. |
| `POST /api/site/v1/content/{id}/published` | site key | `{ "url": "…" }`: the article is live there. Repeating the same address is safe. |
| `POST /api/site/v1/content/{id}/failed` | site key | `{ "reason": "…" }`: it could not be published. It waits for the owner to send it again. |
| `GET /api/site/v1/public/{slug}?d={domain}` | public | The confirmed facts as JSON. |
| `GET /api/site/v1/webmcp.js?s={slug}&d={domain}&v={version}` | public | The WebMCP script for the page head. |
| `GET /api/site/v1/snippet.js?s={slug}&d={domain}` | public | The script behind the snippet tag ([any-site.md](any-site.md)). |

Refusals carry `{"ok": false, "error", "message"}`. On `401`, `403` or `409`, stop serving the files: the key is unknown or revoked, the connector is off, or nothing is confirmed to publish. On a timeout or a `5xx`, keep serving the last copy you have.

## Webhooks

Add an https address in the **For agents** tab, up to three per site. The signing secret (`whsec_…`) is shown once, when you add it. INITE sends a `POST` for two events:

- `facts.confirmed`: each time the facts are confirmed.
- `content.approved`: each time the owner approves an article. It carries the article, so you can publish it without asking the queue.

```http
POST /your/endpoint
Content-Type: application/json
User-Agent: INITE-Webhooks/1.0 (+https://inite.ai/en/mcp#site-api)
INITE-Event: facts.confirmed
INITE-Webhook-Id: evt_3hGkV0bq9rS1xYw2LmN4pQ7z
INITE-Signature: t=1792663200,v1=5f2b…

{
  "id": "evt_3hGkV0bq9rS1xYw2LmN4pQ7z",
  "event": "facts.confirmed",
  "site": "acme.com",
  "slug": "acme",
  "version": 4,
  "confirmedAt": "2026-10-22T10:00:00.000Z",
  "manifestUrl": "https://inite.ai/api/site/v1/manifest",
  "factsUrl": "https://inite.ai/api/site/v1/public/acme?d=acme.com"
}
```

```json
{
  "id": "evt_Vb1mR8sQx2LkT0wYh7nP4cZd",
  "event": "content.approved",
  "site": "acme.com",
  "slug": "acme",
  "article": {
    "id": "cm2y0v7ka0004",
    "lang": "en",
    "title": "How much does a dental cleaning cost in Austin?",
    "slug": "dental-cleaning-cost-austin",
    "metaDescription": "What a cleaning costs at Acme Dental, what it includes, and when insurance covers it.",
    "body": "## What a cleaning includes\n\nA cleaning at Acme Dental takes about 45 minutes…",
    "html": "<h2>What a cleaning includes</h2>\n<p>A cleaning at Acme Dental takes about 45 minutes…</p>\n",
    "sources": [{ "url": "https://www.ada.org/resources/research/health-policy-institute", "title": "ADA Health Policy Institute" }],
    "approvedAt": "2026-10-22T09:30:00.000Z"
  },
  "report": {
    "published": "https://inite.ai/api/site/v1/content/cm2y0v7ka0004/published",
    "failed": "https://inite.ai/api/site/v1/content/cm2y0v7ka0004/failed"
  }
}
```

After a `content.approved`, report the outcome with your site key to `/api/site/v1/content/{id}/published` or `/failed`. Until you do, the article also stays in the queue.

### The signature

```
INITE-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>
```

- The HMAC key is the whole secret string, `whsec_` prefix included.
- Sign the **raw body as received**, before any JSON parsing. A re-serialised object has different bytes.
- Refuse a `t` more than five minutes from now.
- Accept the delivery if **any** `v1` in the header matches. Compare in constant time.
- `INITE-Webhook-Id` (and the body's `id`) stays the same on every retry of one event. Store the ids you handled and acknowledge a repeat without acting on it again.

Answer with any `2xx` within ten seconds. Anything else is retried after 1, 5, 30, 120 and 360 minutes. After the sixth attempt the delivery is marked as failed. Redirects are not followed. The cabinet shows the last ten attempts for each address.

### Receivers

| Language | File | Run |
|---|---|---|
| Node.js 18+ | [`examples/node/receiver.mjs`](../examples/node/receiver.mjs) | `INITE_WEBHOOK_SECRET=whsec_… node receiver.mjs` |
| PHP 7.4+ | [`examples/php/receiver.php`](../examples/php/receiver.php) | `INITE_WEBHOOK_SECRET=whsec_… php -S localhost:8787 receiver.php` |
| Python 3.8+ | [`examples/python/receiver.py`](../examples/python/receiver.py) | `INITE_WEBHOOK_SECRET=whsec_… python3 receiver.py` |

Send any of them a signed test event, a stale one or a tampered one with [`examples/send-test-event.mjs`](../examples/send-test-event.mjs). See [`examples/README.md`](../examples/README.md).

Problems: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose) and choose "Webhooks / REST".
