import PlayerConsole from "@/components/PlayerConsole";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto mb-10 max-w-3xl">
        <div className="flex items-center gap-2 font-mono text-xs text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          <span>hls player</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
          Play any HLS stream, straight from a URL
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
          Paste a .m3u8 manifest and it loads with adaptive bitrate switching,
          live resolution and codec readouts, and manual quality control —
          no upload, no account, nothing stored.
        </p>
      </div>

      <PlayerConsole />

      <footer className="mx-auto mt-16 max-w-3xl border-t border-console-line pt-6">
        <p className="font-mono text-xs text-ink-faint">
          Playback runs entirely in your browser via hls.js. This tool does
          not fetch, host, or redistribute video — you provide the manifest
          URL and control what it plays.
        </p>
      </footer>
    </main>
  );
}
