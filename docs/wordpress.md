# WordPress

The INITE Agents plugin serves your confirmed facts from your WordPress site. Source: [inite-ai/inite-agents-wordpress](https://github.com/inite-ai/inite-agents-wordpress). Requires WordPress 6.0+ and PHP 7.4+. The MCP Adapter abilities need WordPress 6.9+.

## Install

1. Download the zip. Either use [inite.ai/downloads/inite-agents.zip](https://inite.ai/downloads/inite-agents.zip), or take `inite-agents.zip` from the [latest Release](https://github.com/inite-ai/inite-agents-wordpress/releases/latest). Both are built from the same source by the same script.
2. In WordPress, go to **Plugins → Add New Plugin → Upload Plugin**, choose the zip and activate it.
3. In the [INITE cabinet](https://inite.ai/en/profile?tab=agents), open **For agents**, confirm your facts and make a site key for the WordPress platform. The key starts with `isk_` and is shown once.
4. In WordPress, open **Settings → INITE Agents**, paste the key and save.
5. Press **Test connection**. The screen shows the facts version and the files now served.

New versions show up on the Plugins screen like any other plugin's. The copy from inite.ai checks `https://inite.ai/downloads/inite-agents.json` at most twice a day, without your key.

Each Release also carries `inite-agents-org.zip`. That is the WordPress.org variant, without the self-updater. Use the first zip unless you know you want this one.

## What each switch does

| Switch | What it does | Default |
|---|---|---|
| Root files | Serves `/llms.txt`, `/.well-known/agent-card.json`, `/.well-known/mcp.json`, `/.well-known/api-catalog` | on |
| robots.txt | Adds the `Content-Signal` line to the `User-agent: *` group of the robots.txt WordPress generates | on |
| Page head | The WebMCP script, `<link>` tags to the files, and the JSON-LD on the front page | on |
| Abilities for the MCP Adapter | Five read-only abilities: `inite/business-facts`, `inite/services`, `inite/hours`, `inite/locations`, `inite/faq` | on |
| Daily report | Sends the plugin version, the paths served and daily counts of known AI agent reads. No visitor data | on |
| Articles | Turns articles you approved in the cabinet into posts, as drafts or published at once | **off** |

A switch that is off claims no URL and prints nothing. The files are answered before WordPress parses the request, without rewrite rules, so there is nothing to flush and nothing left behind.

## It steps aside for what is already there

- A physical file at a path, such as an `llms.txt` you uploaded, wins.
- An SEO plugin that serves its own llms.txt keeps it while that feature is on in it: Yoast SEO, Rank Math, All in One SEO, SEOPress PRO, Website LLMs.txt.
- When Yoast SEO, Rank Math, All in One SEO or SEOPress already prints an Organization schema, the plugin leaves its own out of the JSON-LD.
- With a physical `robots.txt`, the settings screen shows the line to paste yourself.
- Any plugin can claim a root path with the `inite_agents_path_owner` filter.

The settings screen says what was left alone and why.

## MCP through WordPress

On WordPress 6.9+, install the official [MCP Adapter](https://wordpress.org/plugins/mcp-adapter/) plugin. It lists the five abilities on its default server, at `/wp-json/mcp/mcp-adapter-default-server`, for any authenticated WordPress user's agent. Your business also has its own public MCP server at `https://<your-slug>.inite.ai/mcp`, so the Adapter is optional.

## Articles

Switch on **Articles** and choose **Save as drafts** or **Publish at once**. On each hourly sync the plugin asks INITE for the articles you approved and not yet published on this site, and makes one post per article, with its meta description for Yoast SEO or Rank Math. When a post is published, its address goes back to INITE. If a post cannot be made, INITE is told why, and the article waits in the cabinet until you send it again.

## Good to know

- **Subdirectory installs.** If WordPress lives in a subdirectory, it never sees `/llms.txt` at the domain root, and the settings screen says so. Agents still find the files through the head links, which point to `https://<your-slug>.inite.ai`.
- **Staging.** Define `INITE_AGENTS_API` in `wp-config.php`, or use the `inite_agents_api_base` filter, to point the plugin at another INITE origin. The key is only ever sent there.
- **Revoking.** Revoke the key, or switch the connector off in the cabinet. At its next sync the plugin drops its copy and stops serving.
- **External services.** Everything the plugin sends, and when, is listed in the readme's [External services](https://github.com/inite-ai/inite-agents-wordpress#external-services) section.

Problems: [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose) and choose WordPress.
