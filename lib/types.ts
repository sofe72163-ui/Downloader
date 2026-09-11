export interface StreamLevel {
  index: number;
  height: number;
  bitrate: number;
  codec?: string;
}

export type PlaybackStatus =
  | "idle"
  | "loading"
  | "live"
  | "buffering"
  | "error";

export interface StreamTelemetry {
  status: PlaybackStatus;
  activeLevel: StreamLevel | null;
  levels: StreamLevel[];
  bufferedSeconds: number;
  errorMessage: string | null;
}

/**
 * Loose validation only — this app plays whatever manifest the browser/hls.js
 * can parse. We just make sure the input looks like a URL before attempting
 * to load it, and surface a soft warning (not a hard block) if it doesn't
 * look like a typical .m3u8 path.
 */
export function parseStreamUrl(raw: string): { url: string; looksLikeHls: boolean } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const looksLikeHls =
      /\.m3u8(\?.*)?$/i.test(parsed.pathname) ||
      /\.m3u8(\?.*)?$/i.test(trimmed) ||
      parsed.searchParams.has("m3u8");
    return { url: parsed.toString(), looksLikeHls };
  } catch {
    return null;
  }
}

export function formatBitrate(bitsPerSecond: number): string {
  if (bitsPerSecond <= 0) return "—";
  const kbps = bitsPerSecond / 1000;
  if (kbps < 1000) return `${Math.round(kbps)} kbps`;
  return `${(kbps / 1000).toFixed(2)} Mbps`;
}
