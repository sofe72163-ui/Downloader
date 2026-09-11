'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    } 
    // دعم متصفحات سفاري وآيفون التي تشغل HLS برمجياً
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full aspect-video bg-black rounded-lg border border-gray-800 shadow-2xl"
    />
  );
}
