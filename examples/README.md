# Webhook receivers

Three receivers for INITE Agents webhooks, each a single file with no dependencies. Each one:

- checks `INITE-Signature` against the raw body: `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>`, keyed with the whole `whsec_…` secret, any `v1` may match, compared in constant time;
- refuses a `t` more than five minutes from now (`401`);
- drops a repeat of an event it already handled, by `INITE-Webhook-Id`, and still answers `200`;
- answers `200` before doing slow work, and handles `facts.confirmed` and `content.approved`;
- has a `report published` helper that builds the INITE address itself, so your site key only ever goes to `https://inite.ai`.

| | Run |
|---|---|
| [Node.js 18+](node/receiver.mjs) | `INITE_WEBHOOK_SECRET=whsec_… node node/receiver.mjs` |
| [PHP 7.4+](php/receiver.php) | `INITE_WEBHOOK_SECRET=whsec_… php -S localhost:8787 php/receiver.php` |
| [Python 3.8+](python/receiver.py) | `INITE_WEBHOOK_SECRET=whsec_… python3 python/receiver.py` |

Each listens on port 8787 (`PORT` changes it).

## Try one

With a receiver running, send it events signed the way INITE signs them:

```bash
export INITE_WEBHOOK_SECRET=whsec_any_test_value
node send-test-event.mjs http://localhost:8787/                            # 200 ok
node send-test-event.mjs http://localhost:8787/ --id evt_same              # 200 ok
node send-test-event.mjs http://localhost:8787/ --id evt_same              # 200 already handled
node send-test-event.mjs http://localhost:8787/ --event content.approved   # 200 ok
node send-test-event.mjs http://localhost:8787/ --stale                    # 401 bad signature
node send-test-event.mjs http://localhost:8787/ --tamper                   # 401 bad signature
```

All three receivers give these answers. They were also checked against the signer INITE runs in production.

## Before production

- Keep handled event ids in your database, not in memory.
- Do the CMS work in a queue or a background job. INITE waits ten seconds for the `2xx`.
- Serve the receiver over https. INITE only posts to https addresses.
- Keep `INITE_WEBHOOK_SECRET` and `INITE_SITE_KEY` out of your repository.
