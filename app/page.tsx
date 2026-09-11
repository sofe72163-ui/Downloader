'use client';
import { useState } from 'react';
import HlsPlayer from '@/components/HlsPlayer';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setStreamUrl('');
    setProxyUrl('');

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء جلب الحلقة');
      }

      setStreamUrl(data.streamUrl);
      
      // نجهز رابط البروكسي عشان نستخدمه للمشغل وللتحميل
      setProxyUrl(`/api/proxy?url=${encodeURIComponent(data.streamUrl)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">مشغل الوسائط الخاص</h1>
          <p className="text-gray-400">ضع رابط الحلقة مباشرة من الموقع ليتم جلبها بدون إعلانات</p>
        </div>

        <form onSubmit={handleExtract} className="flex flex-col md:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://web911...faselhdx.life/..."
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 transition-colors text-left"
            dir="ltr"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري السحب...' : 'تشغيل الحلقة'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {proxyUrl && (
          <div className="space-y-6 animate-fade-in mt-8">
            
            {/* المشغل اللي يعرض الجودات */}
            <HlsPlayer src={proxyUrl} />
            
            <div className="p-6 bg-gray-900 rounded-lg border border-gray-800 space-y-4 text-center">
              <h3 className="text-xl font-bold text-white">الرابط جاهز</h3>
              <p className="text-sm text-gray-400">
                يمكنك مشاهدة الحلقة في الأعلى وتغيير الجودة، أو نسخ رابط التحميل واستخدامه في برامج التنزيل.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    // نسخ رابط البروكسي (وليس الأصلي) لضمان تخطي حماية السيرفر أثناء التحميل
                    const fullProxyUrl = window.location.origin + proxyUrl;
                    navigator.clipboard.writeText(fullProxyUrl);
                    alert('✅ تم نسخ الرابط بنجاح!\n\nافتح برنامج 1DM (في الهاتف) أو IDM (في الكمبيوتر) والصق الرابط ليبدأ التحميل.');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition flex items-center justify-center gap-2"
                >
                  نسخ رابط التحميل (لبرامج 1DM/IDM)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
