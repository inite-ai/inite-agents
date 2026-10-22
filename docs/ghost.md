# Ghost

A Ghost integration of its own is coming. Until it ships, a Ghost site connects in two parts, and both work today: the snippet for the head, and the webhook plus Ghost's Admin API for articles.

## The head: the snippet

In the [INITE cabinet](https://inite.ai/en/profile?tab=agents), open **For agents**, confirm your facts and turn the **Snippet** on. Copy the tag. In Ghost, open **Settings → Advanced → Code injection** and paste it into **Site header**, then save. Ghost prints it on every page through the theme's `{{ghost_head}}`.

For the AI crawlers that read raw HTML only, paste the cabinet's **static block** there instead. Copy it again after each confirm. [any-site.md](any-site.md) explains both.

Ghost does not let a site serve files at `/llms.txt` or `/.well-known/`. Agents reach those files on `https://<your-slug>.inite.ai` through the links the snippet adds.

## Articles: the webhook and the Admin API

1. In Ghost, open **Settings → Advanced → Integrations**, add a custom integration, and copy its **Admin API key** and **API URL**.
2. In the INITE cabinet, make a site key for the **Webhook** platform, and add the https address of your receiver as a webhook. Keep the signing secret.
3. Run one of the [receivers](../examples/) and, for `content.approved`, create the post and report where it went. With Node and [`@tryghost/admin-api`](https://www.npmjs.com/package/@tryghost/admin-api):

   ```js
   import GhostAdminAPI from '@tryghost/admin-api'
   import { reportPublished } from './receiver.mjs'

   const ghost = new GhostAdminAPI({ url: process.env.GHOST_API_URL, key: process.env.GHOST_ADMIN_API_KEY, version: 'v5.0' })

   // In handle(), case 'content.approved':
   const a = event.article
   const post = await ghost.posts.add(
     { title: a.title, slug: a.slug, html: a.html, custom_excerpt: a.metaDescription.slice(0, 300), meta_description: a.metaDescription, status: 'draft' },
     { source: 'html' },
   )
   // A draft has no public address yet. Report it once you publish the post in Ghost,
   // or create it with status: 'published' and report post.url right away:
   // await reportPublished(a.id, post.url)
   ```

   If the post cannot be made, report it to `/api/site/v1/content/{id}/failed` with the reason. The article then waits in the cabinet until the owner sends it again.

Instead of the webhook, you can also ask the queue on a schedule: `GET /api/site/v1/content/queue` with the site key ([webhooks-and-rest.md](webhooks-and-rest.md)).

Problems: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose) and choose Ghost.
