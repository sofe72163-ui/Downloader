'use client';
import { useState } from 'react';
import HlsPlayer from '@/components/HlsPlayer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const [loadingExtract, setLoadingExtract] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  
  const [error, setError] = useState('');

  // 1. دالة البحث
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setLoadingSearch(true);
    setError('');
    setSearchResults([]);
    setSelectedSeries(null);
    setProxyUrl('');

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  // 2. دالة التعامل مع النتيجة (فيلم أو مسلسل)
  const handleResultClick = async (item: any) => {
    setError('');
    setProxyUrl('');

    if (item.isSeries) {
      setSelectedSeries(item);
      setLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/episodes?url=${encodeURIComponent(item.url)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setEpisodes(data.episodes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingEpisodes(false);
      }
    } else {
      extractVideo(item.url);
    }
  };

  // 3. دالة استخراج الفيديو
  const extractVideo = async (targetUrl: string) => {
    setLoadingExtract(true);
    setError('');
    setProxyUrl('');
    setStreamUrl('');

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء جلب الفيديو');

      setStreamUrl(data.streamUrl);
      setProxyUrl(`/api/proxy?url=${encodeURIComponent(data.streamUrl)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingExtract(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">منصة المشاهدة الخاصة</h1>
          <p className="text-gray-400">ابحث عن أي فيلم أو مسلسل وشاهده أو حمله بدون إعلانات</p>
        </div>

        {/* مربع البحث */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="اكتب اسم الفيلم أو المسلسل..."
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 transition-colors text-right"
            dir="rtl"
            required
          />
          <button
            type="submit"
            disabled={loadingSearch}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingSearch ? 'جاري البحث...' : 'بحث'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* عرض المشغل إذا تم جلب الفيديو */}
        {proxyUrl && (
          <div className="space-y-6 animate-fade-in mt-8 max-w-4xl mx-auto">
            <HlsPlayer src={proxyUrl} />
            <div className="p-6 bg-gray-900 rounded-lg border border-gray-800 text-center space-y-4">
              <h3 className="text-xl font-bold text-white">رابط الحلقة جاهز للتحميل</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(streamUrl); // نسخ الرابط الصافي للسرعة القصوى
                  alert('✅ تم نسخ الرابط المباشر بنجاح!\n\nافتح برنامج 1DM أو IDM والصق الرابط.');
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition mx-auto"
              >
                نسخ الرابط المباشر (لبرامج التحميل)
              </button>
            </div>
          </div>
        )}

        {/* شاشة تحميل الاستخراج */}
        {loadingExtract && (
          <div className="text-center text-teal-400 py-8 font-bold animate-pulse">
            جاري سحب الفيديو وفك التشفير، يرجى الانتظار...
          </div>
        )}

        {/* عرض الحلقات إذا كان الاختيار مسلسل */}
        {selectedSeries && !proxyUrl && !loadingExtract && (
          <div className="space-y-4 border-t border-gray-800 pt-8">
            <h2 className="text-2xl font-bold text-white text-right">حلقات: {selectedSeries.title}</h2>
            {loadingEpisodes ? (
              <p className="text-center text-gray-400">جاري جلب الحلقات...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 dir-rtl text-right">
                {episodes.map((ep, i) => (
                  <button
                    key={i}
                    onClick={() => extractVideo(ep.url)}
                    className="p-3 bg-gray-900 hover:bg-teal-900 border border-gray-800 hover:border-teal-500 rounded-lg transition-colors text-sm font-semibold"
                  >
                    {ep.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* عرض نتائج البحث */}
        {!selectedSeries && searchResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-8 border-t border-gray-800">
            {searchResults.map((item, i) => (
              <div 
                key={i} 
                onClick={() => handleResultClick(item)}
                className="group cursor-pointer space-y-2"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-gray-800 group-hover:border-teal-500 transition-colors">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">لا توجد صورة</div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-xs font-bold rounded text-white">
                    {item.isSeries ? 'مسلسل' : 'فيلم'}
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-gray-300 group-hover:text-white transition-colors text-right line-clamp-2">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
