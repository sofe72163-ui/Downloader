import type { PlaybackStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  PlaybackStatus,
  { label: string; dot: string; pulse?: boolean }
> = {
  idle: { label: "idle", dot: "bg-ink-faint" },
  loading: { label: "resolving manifest", dot: "bg-signal", pulse: true },
  live: { label: "live", dot: "bg-signal" },
  buffering: { label: "buffering", dot: "bg-signal", pulse: true },
  error: { label: "error", dot: "bg-warn" },
};

export default function StatusBadge({ status }: { status: PlaybackStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-2 w-2 rounded-full ${config.dot} ${
            config.pulse ? "animate-blink" : ""
          }`}
        />
      </span>
      <span>{config.label}</span>
    </div>
  );
}
