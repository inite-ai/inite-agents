# INITE Agents

**An AI agent that comes to your site gets the facts your business confirmed.** That is the whole promise, and it is narrow on purpose. INITE Agents does not promise more recommendations or more traffic. It promises that ChatGPT, Claude, Perplexity or an agent in a visitor's browser gets your real services, prices, hours, locations and answers when it reads your site, and gets nothing you did not confirm.

You confirm the facts once in the [INITE cabinet](https://inite.ai/en/profile?tab=agents). INITE generates the files agents look for and runs an MCP server for your business. A connector on your site then serves everything from your own domain.

| What agents get | Where |
|---|---|
| `llms.txt` | `/llms.txt` |
| A2A agent card | `/.well-known/agent-card.json` |
| MCP server card ([`server.json`](https://github.com/modelcontextprotocol/registry) shape) | `/.well-known/mcp.json` |
| API catalog ([RFC 9727](https://www.rfc-editor.org/rfc/rfc9727)) | `/.well-known/api-catalog` |
| `Content-Signal` line ([contentsignals.org](https://contentsignals.org)): search and answers yes, training no | `robots.txt` |
| WebMCP tools for an agent in the browser, `<link>` tags to the files, JSON-LD (Organization or LocalBusiness, FAQPage) | the page `<head>` |
| A remote MCP server with read-only tools: business facts, services, hours, locations, FAQ | `https://<your-slug>.inite.ai/mcp` |
| Optional: articles written from measured search demand, published only after you approve each one | your CMS |

## Connectors

| Platform | Connector | Get it | Docs |
|---|---|---|---|
| **WordPress** | Plugin: root files, robots.txt, head, abilities for the WordPress MCP Adapter, articles | [Releases](https://github.com/inite-ai/inite-agents-wordpress/releases) · [inite.ai zip](https://inite.ai/downloads/inite-agents.zip) · [source](https://github.com/inite-ai/inite-agents-wordpress) | [docs/wordpress.md](docs/wordpress.md) |
| **Next.js** | npm package: two route files and one head component, plus the article queue | [`@inite/site-agents`](https://www.npmjs.com/package/@inite/site-agents) · [source](https://github.com/inite-ai/site-agents) | [docs/nextjs.md](docs/nextjs.md) |
| **Any site with a head-code box** (Tilda, Squarespace, Wix, Webflow, Framer, Ghost, Shopify, Bitrix, Joomla, hand-made) | The snippet: one `<script>` tag, no key | the cabinet | [docs/any-site.md](docs/any-site.md) |
| **Ghost** | The snippet for the head, the webhook and the Admin API for articles | the cabinet | [docs/ghost.md](docs/ghost.md) |
| **Any stack** | REST endpoints with a site key, and signed webhooks | the cabinet | [docs/webhooks-and-rest.md](docs/webhooks-and-rest.md) · [examples/](examples/) |
| Webflow, Shopify, Framer, Wix, Notion, WordPress.com | Apps of their own are coming. Until then, the snippet connects all of these except Notion | | |

The full API reference is at **https://inite.ai/en/mcp#site-api**.

## What INITE never does

- Publishes a fact or a price you did not confirm.
- Puts an article on your site that you did not approve.
- Keeps a route claimed by a switched-off connector. Every connector switches off whole, and a feature that is off claims no URL and prints nothing.
- Sends your site key anywhere but `https://inite.ai`. Connectors build every address from that origin and never follow a redirect with the key.
- Lets an INITE outage take your site down. Connectors keep a copy and refresh it on a timer: hourly from WP-Cron in WordPress, at most once per period in Next.js, with a five-second limit. If INITE is down, the last good copy is served.

## This repository

- [`docs/`](docs/): setup for each platform.
- [`examples/`](examples/): webhook receivers that verify the signature, in Node.js, PHP and Python, and a script that sends a signed test event.
- Issues for every connector go here: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose).

The connectors' code lives in INITE's private monorepo. [inite-agents-wordpress](https://github.com/inite-ai/inite-agents-wordpress) and [site-agents](https://github.com/inite-ai/site-agents) are read-only mirrors of it, updated on every change. See [CONTRIBUTING.md](CONTRIBUTING.md).

Security reports: **security@inite.ai** ([SECURITY.md](SECURITY.md)).

## License

The docs and examples here are MIT licensed. The WordPress plugin is GPL-2.0-or-later. The Next.js package is MIT.
