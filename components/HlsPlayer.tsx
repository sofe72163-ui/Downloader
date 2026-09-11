"use client";

import { useEffect, useRef } from "react";
import Hls, { ErrorData, Level } from "hls.js";
import type { StreamLevel, PlaybackStatus } from "@/lib/types";

interface HlsPlayerProps {
  src: string;
  requestedLevel: number; // -1 = auto
  onStatusChange: (status: PlaybackStatus) => void;
  onLevelsParsed: (levels: StreamLevel[]) => void;
  onActiveLevelChange: (level: StreamLevel | null) => void;
  onBufferUpdate: (bufferedSeconds: number) => void;
  onErrorMessage: (message: string | null) => void;
}

function toStreamLevel(level: Level, index: number): StreamLevel {
  return {
    index,
    height: level.height ?? 0,
    bitrate: level.bitrate ?? 0,
    codec: level.videoCodec ?? level.codecSet ?? undefined,
  };
}

export default function HlsPlayer({
  src,
  requestedLevel,
  onStatusChange,
  onLevelsParsed,
  onActiveLevelChange,
  onBufferUpdate,
  onErrorMessage,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // (Re)build the player whenever the source changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    onStatusChange("loading");
    onErrorMessage(null);
    onActiveLevelChange(null);
    onLevelsParsed([]);

    // Native HLS support (Safari, iOS) — no hls.js needed.
    const canPlayNatively = video.canPlayType("application/vnd.apple.mpegurl");

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const levels = data.levels.map(toStreamLevel);
        onLevelsParsed(levels);
        onStatusChange("live");
        video.play().catch(() => {
          // Autoplay was blocked — user can press play manually.
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          onActiveLevelChange(toStreamLevel(level, data.level));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data: ErrorData) => {
        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            onErrorMessage(
              "Network error while loading the stream. Retrying…"
            );
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            onErrorMessage("Media error. Attempting to recover…");
            hls.recoverMediaError();
            break;
          default:
            onErrorMessage(
              "This stream could not be loaded. Check the URL and try again."
            );
            onStatusChange("error");
            hls.destroy();
            hlsRef.current = null;
            break;
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (canPlayNatively) {
      video.src = src;
      const handleLoaded = () => {
        onStatusChange("live");
        video.play().catch(() => {});
      };
      const handleError = () => {
        onErrorMessage(
          "This stream could not be loaded. Check the URL and try again."
        );
        onStatusChange("error");
      };
      video.addEventListener("loadedmetadata", handleLoaded);
      video.addEventListener("error", handleError);
      return () => {
        video.removeEventListener("loadedmetadata", handleLoaded);
        video.removeEventListener("error", handleError);
        video.removeAttribute("src");
        video.load();
      };
    }

    onErrorMessage("HLS playback is not supported in this browser.");
    onStatusChange("error");
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // React to quality selection changes.
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = requestedLevel;
  }, [requestedLevel]);

  // Poll buffered range + waiting/playing state for the telemetry strip.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBuffer = () => {
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        onBufferUpdate(Math.max(0, end - video.currentTime));
      } else {
        onBufferUpdate(0);
      }
    };

    const handleWaiting = () => onStatusChange("buffering");
    const handlePlaying = () => onStatusChange("live");

    video.addEventListener("progress", updateBuffer);
    video.addEventListener("timeupdate", updateBuffer);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("progress", updateBuffer);
      video.removeEventListener("timeupdate", updateBuffer);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full bg-black"
      controls
      playsInline
      muted={false}
    />
  );
}
