# Next.js

[`@inite/site-agents`](https://www.npmjs.com/package/@inite/site-agents) serves your confirmed facts from a Next.js app (App Router, Next 15 or 16, React 19, Node 20+). It has no runtime dependencies beyond Next and React. Source and the full reference: [inite-ai/site-agents](https://github.com/inite-ai/site-agents#readme).

## Install

```bash
npm install @inite/site-agents
```

**1. The key.** In the [INITE cabinet](https://inite.ai/en/profile?tab=agents), open **For agents**, confirm your facts and make a site key for the Next.js platform. Set it in your environment:

```bash
INITE_SITE_KEY=isk_...
```

**2. Two route files.**

```ts
// app/llms.txt/route.ts
export { GET, HEAD } from "@inite/site-agents/llms-txt";
```

```ts
// app/.well-known/[file]/route.ts
export { GET, HEAD } from "@inite/site-agents/well-known";
```

**3. One component** in the root layout:

```tsx
// app/layout.tsx
import { SiteAgentsHead } from "@inite/site-agents/head";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SiteAgentsHead />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Until the facts are confirmed, or with no key, the routes answer 404 and the component renders nothing.

## robots.txt

Next's `app/robots.ts` has no field for `Content-Signal`. Serve robots.txt from a route handler instead:

```ts
// app/robots.txt/route.ts: no rules of your own
export { GET } from "@inite/site-agents/robots-txt";
```

```ts
// app/robots.txt/route.ts: the object your app/robots.ts returned, plus the line
import { defaultSiteAgents } from "@inite/site-agents";
import robots from "./rules";

export const { GET } = defaultSiteAgents().robotsRoute(robots);
```

## Configuration

| Variable | Default | What |
|---|---|---|
| `INITE_SITE_KEY` | (none) | The site key. Without it nothing is served and INITE is never called. |
| `INITE_ORIGIN` | `https://inite.ai` | The service. Must be https. Plain http works only for localhost. |
| `INITE_SITE_AGENTS_OFF` | (none) | Features to switch off, comma-separated: `files,robots,head,webmcp,jsonLd,ping`. |
| `INITE_SITE_AGENTS_REVALIDATE` | `3600` | Seconds a copy is used before INITE is asked again. |

The copy lives in Next's data cache under the tag `inite-site-agents`, so every instance of a deployment shares it. `revalidateTag("inite-site-agents")` refreshes it at once. A good place for that call is a [webhook receiver](webhooks-and-rest.md) listening for `facts.confirmed`.

## Articles

`createContentQueue()` reads the articles you approved and reports where each was published:

```ts
import { createContentQueue } from "@inite/site-agents";

const inite = createContentQueue();
const q = await inite.queue();
if (q.ok) {
  for (const a of q.items) {
    const url = await createPost(a); // your CMS
    await inite.published(a.id, url);
  }
}
```

Run it on a schedule (Vercel Cron, a GitHub workflow, crontab), or when the `content.approved` webhook arrives. Details: [the package README](https://github.com/inite-ai/site-agents#articles-the-content-queue).

Problems: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose) and choose Next.js.
