# Signal — HLS Stream Player

A minimal, self-contained web app for playing HLS (`.m3u8`) streams in the
browser. Paste a manifest URL, it loads with adaptive bitrate switching via
[hls.js](https://github.com/video-dev/hls.js), and a small telemetry strip
shows live resolution, bitrate, codec, and buffer health.

There is no backend, no scraping, and nothing is stored — you supply a
stream URL you already have the right to play, and the app plays it.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- hls.js for MSE-based playback, with native `<video>` fallback for Safari/iOS

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and paste any public `.m3u8` URL.

## Project structure

```
app/
  layout.tsx        Root layout, font loading, metadata
  page.tsx           Landing content (server component)
  globals.css        Tailwind layers + console theme
components/
  PlayerConsole.tsx  Client component: input, panel, telemetry, actions
  HlsPlayer.tsx      hls.js wrapper with native-HLS fallback and error recovery
  StatusBadge.tsx    Small live/buffering/error indicator
lib/
  types.ts           Shared types + URL validation/formatting helpers
```

## Notes on the design

The UI is framed like a broadcast/signal-monitoring console rather than a
generic SaaS card layout: the readout strip (resolution / bitrate / codec /
buffer) reflects real values pulled from hls.js's `LEVEL_SWITCHED` event and
the video element's buffered ranges, not decorative labels.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel (framework preset: Next.js — auto-detected).
3. No environment variables are required.
4. Deploy.

## Browser support

- Chrome, Firefox, Edge: playback via hls.js (Media Source Extensions).
- Safari / iOS: native HLS support via the `<video>` element, hls.js is
  skipped automatically.
- Autoplay may be blocked by the browser; if so, use the native player
  controls to start playback manually.

## Limitations

- CORS: the browser fetches the manifest and segments directly from the
  origin you provide. If that origin doesn't send permissive CORS headers,
  playback will fail — this is expected, since the app does not proxy
  requests or attempt to bypass access controls.
- "Save this stream" gives you the manifest URL plus VLC/ffmpeg instructions
  rather than a one-click download, since HLS streams are segmented and
  downloading them is inherently a client-side, tool-driven step.
