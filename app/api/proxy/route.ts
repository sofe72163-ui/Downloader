import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) return new NextResponse('Missing URL', { status: 400 });

  try {
    const origin = new URL(targetUrl).origin;
    
    // جلب البث مع تزييف مصدر الطلب (Referer) ليقبله سيرفر الفيديو
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': origin + '/',
        'Origin': origin
      }
    });

    if (!res.ok) throw new Error(`Upstream error: ${res.status}`);

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const isM3u8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl');

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': contentType,
    };

    // إذا كان الملف هو قائمة تشغيل m3u8، نقوم بتعديل الروابط بداخلها لتمر عبر البروكسي أيضاً
    if (isM3u8) {
      const text = await res.text();
      const baseUrl = new URL(targetUrl);
      
      const rewrittenLines = text.split('\n').map(line => {
        const trimmed = line.trim();
        // السطور التي لا تبدأ بـ # هي روابط لملفات m3u8 أخرى أو أجزاء .ts
        if (trimmed && !trimmed.startsWith('#')) {
          const absoluteUrl = new URL(trimmed, baseUrl).href;
          return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        }
        return line;
      });
      
      return new NextResponse(rewrittenLines.join('\n'), { headers: corsHeaders });
    } else {
      // إذا كان جزء فيديو (.ts) نمرره كبيانات خام
      return new NextResponse(res.body as any, { headers: corsHeaders });
    }
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
