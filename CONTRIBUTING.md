# Contributing

**Issues are welcome, for every connector, here:** [open an issue](https://github.com/inite-ai/inite-agents/issues/new/choose). Bugs, unclear docs, a platform you need, a conflict with another plugin: all of it belongs here, including problems with the WordPress plugin and the npm package.

## Where the code lives

The connectors are developed in INITE's private monorepo, next to the service they talk to, and checked there by the same tests. Two public repositories mirror them, read-only, on every change:

- [inite-ai/inite-agents-wordpress](https://github.com/inite-ai/inite-agents-wordpress): the WordPress plugin. A Release with both zips is made for each version.
- [inite-ai/site-agents](https://github.com/inite-ai/site-agents): `@inite/site-agents`. It is published to npm from there, with provenance.

## Pull requests

Pull requests on the mirrors are welcome. A mirror is overwritten on its next update, so they are not merged there. We read each one, port the change into the monorepo by hand, and close the PR when the change arrives with the next mirror. A small, focused change with a sentence on why it is needed is the easiest to port.

Pull requests on this repository, for the docs and the examples, are merged here as usual.

## Security

Do not open a public issue for a vulnerability. Write to security@inite.ai ([SECURITY.md](SECURITY.md)).
