'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  // حالات لتخزين الجودات المتاحة والجودة الحالية
  const [levels, setLevels] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hlsRef.current = hls;
      
      hls.loadSource(src);
      hls.attachMedia(video);

      // التقاط الجودات المتاحة عند قراءة الرابط
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLevels(data.levels);
      });

      // تحديث الواجهة عند تغير الجودة
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(data.level);
      });
    } 
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  // دالة لتغيير الجودة يدوياً
  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const levelIndex = Number(e.target.value);
    setCurrentLevel(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex; // -1 تعني تلقائي
    }
  };

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        controls
        className="w-full aspect-video bg-black rounded-lg border border-gray-800 shadow-2xl"
      />
      
      {/* شريط اختيار الجودة */}
      {levels.length > 0 && (
        <div className="flex items-center gap-3 bg-gray-900 p-4 rounded-lg border border-gray-800">
          <span className="text-sm font-bold text-gray-300">دقة العرض:</span>
          <select
            value={currentLevel}
            onChange={handleQualityChange}
            className="bg-gray-800 text-white text-sm font-semibold rounded-md px-4 py-2 border border-gray-700 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value={-1}>تلقائي (Auto)</option>
            {levels.map((level, i) => (
              <option key={i} value={i}>
                {level.height}p {level.bitrate ? `(${(level.bitrate / 1000000).toFixed(1)} Mbps)` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
