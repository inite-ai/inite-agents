# Security

Report a vulnerability in INITE Agents, its connectors (the WordPress plugin, `@inite/site-agents`, the snippet) or the connector API to **security@inite.ai**. INITE publishes the same contact in [inite.ai/.well-known/security.txt](https://inite.ai/.well-known/security.txt). Please do not open a public issue for it.

Tell us what you found, how to reproduce it, and which version or URL it affects. We answer in English, Russian, Portuguese or Spanish.

Some areas we care about most:

- a site key or a webhook secret reaching any origin other than `https://inite.ai`, or appearing in a page, a log or a cache key;
- content from the service escaping into markup: the head tags, the JSON-LD, robots.txt or the response headers of the served files;
- a connector serving facts that were not confirmed, or still serving after the key was revoked;
- webhook signature checks that can be bypassed.

Please test only against your own sites and your own INITE account.
