import { NextResponse } from 'next/server';
import vm from 'vm';

export const runtime = 'nodejs'; // إجبار Vercel على استخدام بيئة Node الكاملة لدعم vm

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'الرجاء إدخال رابط الحلقة' }, { status: 400 });

    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    
    // 1. جلب صفحة الحلقة الأساسية
    const res1 = await fetch(url, { headers });
    const html1 = await res1.text();

    // 2. البحث عن رابط المشغل (iframe أو redirect)
    const playerMatch = html1.match(/(https?:\/\/[^"'\s]+\/video_player\?player_token=[^"'\s]+)/);
    if (!playerMatch) return NextResponse.json({ error: 'لم يتم العثور على مشغل الفيديو في هذه الصفحة' }, { status: 404 });
    const playerUrl = playerMatch[1];

    // 3. جلب كود المشغل الداخلي
    const res2 = await fetch(playerUrl, { headers: { ...headers, Referer: url } });
    const html2 = await res2.text();

    // 4. استخراج كود الجافاسكريبت المشفر
    const scripts = html2.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let targetScript = '';
    for (const s of scripts) {
      const clean = s.replace(/<\/?script[^>]*>/gi, '');
      if (clean.includes('_0x')) targetScript += clean + '\n';
    }

    if (!targetScript) return NextResponse.json({ error: 'لم يتم العثور على الكود المشفر للمشغل' }, { status: 404 });

    // 5. بناء بيئة وهمية لفك التشفير بأمان واستخراج الرابط
    const sandbox: any = {
      extractedUrl: '',
      jwplayer: () => ({
        setup: (conf: any) => {
          if (conf.file) sandbox.extractedUrl = conf.file;
          else if (conf.sources) sandbox.extractedUrl = conf.sources[0].file;
        },
        getPosition: () => 0,
        seek: () => {}
      }),
      document: { getElementById: () => ({}), querySelector: () => ({}) },
      window: { location: { href: '' } }
    };

    vm.createContext(sandbox);
    vm.runInContext(targetScript + ';', sandbox);

    if (!sandbox.extractedUrl) {
      return NextResponse.json({ error: 'فشل فك التشفير واستخراج الرابط' }, { status: 500 });
    }

    // إرجاع الرابط الصافي
    return NextResponse.json({ streamUrl: sandbox.extractedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
