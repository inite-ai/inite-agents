# Ghost

Ghost runs no plugins, so a Ghost site connects in two parts. INITE publishes your approved articles to Ghost itself, through Ghost's Admin API. The snippet takes care of the head.

## Articles: INITE publishes through the Admin API

1. In Ghost, open **Settings → Advanced → Integrations** and add a custom integration. Call it INITE Agents.
2. Copy its **Admin API URL** and **Admin API key**. You need the Admin API key, not the Content API key.
3. In the [INITE cabinet](https://inite.ai/en/profile?tab=agents), open **For agents**, find the Ghost panel and paste both.
4. Choose what happens when you approve an article: **publish it on Ghost at once**, or **leave it in Ghost as a draft** for you to publish there.
5. Save. INITE tests the connection within a minute and shows the result in the panel.

From then on, each article you approve in the cabinet becomes one Ghost post, with its title, slug, meta description and HTML body. A retry never makes a second post. If Ghost refuses, the panel says why: a wrong key, an address that is not the Admin API, an address that redirects.

INITE stores the Admin API key encrypted and shows only its id. Remove the connection in the panel, or delete the integration in Ghost, to revoke it.

## The head: the snippet

In the cabinet, turn the **Snippet** on and copy the tag. In Ghost, open **Settings → Advanced → Code injection** and paste it into **Site header**, then save. Ghost prints it on every page through the theme's `{{ghost_head}}`.

For the AI crawlers that read raw HTML only, paste the cabinet's **static block** there instead, and copy it again after each confirm. [any-site.md](any-site.md) explains both.

Ghost does not let a site serve files at `/llms.txt` or `/.well-known/`. Agents reach those files on `https://<your-slug>.inite.ai` through the links the snippet adds.

## Doing it yourself instead

If you would rather run the publishing yourself, take articles from the signed `content.approved` webhook or from the queue, create posts with Ghost's Admin API, and report each address back. [webhooks-and-rest.md](webhooks-and-rest.md) and the [receivers](../examples/) show how.

Problems: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose) and choose Ghost.
