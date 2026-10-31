# Links

Keep a shared shelf of URLs with metadata previews, ordering, search and undo.

## Install

Requires a running [Ink OS](https://github.com/siliconjungle/ink-os-platform) instance and its `ink-os` CLI. Use Node.js 24 or later for development.

```sh
git clone https://github.com/siliconjungle/ink-app-links.git
cd ink-app-links
npm test
npm run build
# Select your Ink instance using its CLI connection profile.
ink-os deploy .
```

The CLI deploys committed source from your checkout. Commit any edits before deploying them. No credentials or personal instance configuration belong in this repository.

## Behaviour and limits

Preview metadata is fetched by the backend with bounded public HTTP/S requests. Websites that block previews remain usable links. No external embed scripts run; remote preview images may become unavailable.

## License

MIT for app code. Bundled third-party components retain their own licenses and notices.
