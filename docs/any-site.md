# Any site: the snippet

If your site builder lets you paste code into the page `<head>`, one tag connects it. This covers Tilda, Squarespace, Wix, Webflow, Framer, Ghost, Shopify, Bitrix, Joomla and hand-made sites. The tag carries no key, so it is safe in public HTML.

> The snippet ships with the next inite.ai release. If the cabinet does not offer the **Snippet** platform yet, it will shortly.

## Set it up

1. In the [INITE cabinet](https://inite.ai/en/profile?tab=agents), open **For agents**, confirm your facts and turn the **Snippet** on.
2. Copy the tag. It looks like this, with your own slug and domain:

   ```html
   <script src="https://inite.ai/api/site/v1/snippet.js?s=acme&amp;d=acme.com" async></script>
   ```

   The tag stays the same when you confirm a new version. The script it loads is always the current one.
3. Paste it into the head of every page, in the place your platform keeps head code:

   | Platform | Where |
   |---|---|
   | Tilda | Site Settings → Insert Code → "HTML code for the HEAD section". Save, then republish all pages. |
   | Squarespace | Custom code → Code Injection → Header. Needs the Core, Plus or Advanced plan. |
   | Wix | Settings → Custom Code → Add Custom Code. All pages, Place Code in: Head. Needs a published site with its own domain. |
   | Webflow | Site settings → Custom code → Head code. Save, then Publish. Needs a paid site plan. |
   | Framer | Site Settings → Code. Add a snippet at the start of `<head>`, then Publish. The canvas preview does not run it. |
   | Ghost | Settings → Advanced → Code injection → Site header. See also [ghost.md](ghost.md). |
   | Shopify | Online Store → Themes → … → Edit code → Layout → `theme.liquid`, just before `</head>`. |
   | 1C-Bitrix | The site template's `<head>`, next to `ShowHead()`. Then clear the cache. |
   | Joomla | A child template of Cassiopeia, inside `<head>` in its `index.php`, made the default style. |
   | Anything else | The template or layout all pages share, inside `<head>`. |

4. Publish your site. The cabinet shows when a browser last loaded the snippet. Once a day INITE reads your homepage to check that the tag is there.

## What the tag does, and what it cannot do

The script registers the WebMCP tools, adds `<link>` tags pointing to your files on `https://<your-slug>.inite.ai`, and adds the JSON-LD of your confirmed facts. All of this happens once the page runs in a browser. Agents working in a browser see it, and so do crawlers that run JavaScript, Google's among them.

Most AI crawlers, GPTBot, ClaudeBot and PerplexityBot among them, read the raw HTML and do not run JavaScript. They see only the tag. For them, the cabinet also offers a **static block**: the tag, the links and the JSON-LD of one confirmed version as plain HTML, with a marker such as `<meta name="inite-agents" content="acme v4">`. Paste the block instead of the tag. Each time you confirm a new version, copy the block again and replace the old one. The daily homepage check tells you when the block on your site is behind.

## Root files

The snippet cannot put `/llms.txt` or `/.well-known/*` at your domain root. If your host lets you upload files to the root, you can serve them yourself. Fetch them with a site key for the Webhook platform from `GET /api/site/v1/files/{name}`, and refresh them when the `facts.confirmed` webhook arrives (see [webhooks-and-rest.md](webhooks-and-rest.md)). Until then, agents reach the same files on `https://<your-slug>.inite.ai` through the head links.

Problems: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose) and choose "Snippet / any site".
