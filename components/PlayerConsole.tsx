"use client";

import { useMemo, useState } from "react";
import HlsPlayer from "./HlsPlayer";
import StatusBadge from "./StatusBadge";
import {
  formatBitrate,
  parseStreamUrl,
  type PlaybackStatus,
  type StreamLevel,
} from "@/lib/types";

export default function PlayerConsole() {
  const [inputValue, setInputValue] = useState("");
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [levels, setLevels] = useState<StreamLevel[]>([]);
  const [activeLevel, setActiveLevel] = useState<StreamLevel | null>(null);
  const [requestedLevel, setRequestedLevel] = useState<number>(-1);
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isBusy = status === "loading" || status === "buffering";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseStreamUrl(inputValue);

    if (!parsed) {
      setFormWarning("That doesn't look like a valid URL.");
      return;
    }

    setFormWarning(
      parsed.looksLikeHls
        ? null
        : "This URL doesn't end in .m3u8 — loading it anyway, but playback may fail if it isn't an HLS manifest."
    );
    setRequestedLevel(-1);
    setActiveSrc(parsed.url);
  }

  async function handleCopy() {
    if (!activeSrc) return;
    try {
      await navigator.clipboard.writeText(activeSrc);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — fail silently, URL is visible in the input.
    }
  }

  const sortedLevels = useMemo(
    () => [...levels].sort((a, b) => b.height - a.height),
    [levels]
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label
          htmlFor="stream-url"
          className="font-mono text-xs text-ink-muted"
        >
          stream url
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="stream-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://example.com/path/playlist.m3u8"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 rounded-sm border border-console-line bg-console-900 px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-faint focus:border-signal-dim"
          />
          <button
            type="submit"
            disabled={isBusy && activeSrc !== null}
            className="whitespace-nowrap rounded-sm bg-signal px-5 py-3 text-sm font-medium text-console-950 transition hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "Loading…" : "Load stream"}
          </button>
        </div>
        {formWarning && (
          <p className="font-mono text-xs text-warn">{formWarning}</p>
        )}
      </form>

      {/* Player panel */}
      <div className="mt-6 overflow-hidden rounded-sm border border-console-line bg-console-900 shadow-panel">
        <div className="flex items-center justify-between border-b border-console-line px-4 py-2.5">
          <StatusBadge status={status} />
          {activeSrc && (
            <span className="max-w-[60%] truncate font-mono text-xs text-ink-faint">
              {activeSrc}
            </span>
          )}
        </div>

        <div className="relative aspect-video w-full bg-black">
          {activeSrc ? (
            <HlsPlayer
              src={activeSrc}
              requestedLevel={requestedLevel}
              onStatusChange={setStatus}
              onLevelsParsed={setLevels}
              onActiveLevelChange={setActiveLevel}
              onBufferUpdate={setBufferedSeconds}
              onErrorMessage={setErrorMessage}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
              <div className="h-8 w-8 rounded-full border border-console-line-bright" />
              <p className="max-w-xs font-mono text-xs text-ink-faint">
                No stream loaded. Paste a .m3u8 URL above and load it to
                begin.
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="border-t border-console-line bg-warn-soft px-4 py-3 font-mono text-xs text-warn">
            {errorMessage}
          </div>
        )}

        {/* Telemetry readout */}
        <div className="grid grid-cols-2 gap-px border-t border-console-line bg-console-line sm:grid-cols-4">
          <ReadoutCell
            label="resolution"
            value={activeLevel ? `${activeLevel.height}p` : "—"}
          />
          <ReadoutCell
            label="bitrate"
            value={activeLevel ? formatBitrate(activeLevel.bitrate) : "—"}
          />
          <ReadoutCell
            label="codec"
            value={
              activeLevel?.codec ? activeLevel.codec.split(".")[0] ?? "—" : "—"
            }
          />
          <ReadoutCell
            label="buffer"
            value={`${bufferedSeconds.toFixed(1)}s`}
          />
        </div>
      </div>

      {/* Quality + actions */}
      {sortedLevels.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">quality</span>
          <button
            onClick={() => setRequestedLevel(-1)}
            className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition ${
              requestedLevel === -1
                ? "border-signal-dim bg-signal-soft text-signal"
                : "border-console-line text-ink-muted hover:border-console-line-bright"
            }`}
          >
            auto
          </button>
          {sortedLevels.map((level) => (
            <button
              key={level.index}
              onClick={() => setRequestedLevel(level.index)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition ${
                requestedLevel === level.index
                  ? "border-signal-dim bg-signal-soft text-signal"
                  : "border-console-line text-ink-muted hover:border-console-line-bright"
              }`}
            >
              {level.height}p
            </button>
          ))}
        </div>
      )}

      {activeSrc && (
        <div className="mt-6 rounded-sm border border-console-line bg-console-900 p-4">
          <h2 className="text-sm font-medium text-ink">Save this stream</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Streams play directly in the browser and aren&apos;t stored here.
            To save a copy for offline viewing, open the manifest URL in a
            dedicated downloader.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="rounded-sm border border-console-line px-3 py-2 font-mono text-xs text-ink transition hover:border-console-line-bright"
            >
              {copied ? "Copied" : "Copy manifest URL"}
            </button>
            <code className="flex-1 truncate rounded-sm border border-console-line bg-console-950 px-3 py-2 font-mono text-xs text-ink-faint">
              vlc {activeSrc}
            </code>
          </div>
          <p className="mt-2 font-mono text-xs text-ink-faint">
            VLC: Media → Open Network Stream → paste the URL. ffmpeg: ffmpeg
            -i &quot;URL&quot; -c copy output.mp4
          </p>
        </div>
      )}
    </div>
  );
}

function ReadoutCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-console-900 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </div>
      <div className="tabular mt-0.5 font-mono text-sm text-ink">{value}</div>
    </div>
  );
}
