import { NextResponse } from 'next/server';
import vm from 'vm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'الرجاء إدخال رابط الحلقة' }, { status: 400 });
    }

    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    
    // 1. جلب صفحة الحلقة الأساسية
    const res1 = await fetch(url, { headers });
    const html1 = await res1.text();

    // 2. البحث عن رابط المشغل (iframe)
    const playerMatch = html1.match(/(https?:\/\/[^"'\s]+\/video_player\?player_token=[^"'\s]+)/);
    const playerUrl = playerMatch?.[1];
    if (!playerUrl) {
      return NextResponse.json({ error: 'لم يتم العثور على مشغل الفيديو في هذه الصفحة' }, { status: 404 });
    }

    // 3. جلب كود المشغل الداخلي
    const res2 = await fetch(playerUrl, { headers: { ...headers, Referer: url } });
    const html2 = await res2.text();

    // 4. تصفية واستخراج كود الجافاسكريبت المشفر بالكامل
    const scripts = html2.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let targetScript = '';
    for (const s of scripts) {
      const clean = s.replace(/<\/?script[^>]*>/gi, '');
      if (clean.includes('_0x')) targetScript += clean + '\n';
    }

    if (!targetScript) {
      return NextResponse.json({ error: 'لم يتم العثور على الكود المشفر للمشغل' }, { status: 404 });
    }

    // --- بناء بيئة وهمية (Sandbox) لا يمكن كسرها ---

    // أداة امتصاص الأخطاء: تنجح دائماً بغض النظر عما يطلبه السكربت المشفر
    const blackholeProxy: any = new Proxy(function() {}, {
      get: (target: any, prop: string | symbol) => {
        // حماية ضد محاولات التحويل إلى نصوص أو أرقام
        if (prop === Symbol.toPrimitive || prop === 'toString') return () => '';
        if (prop === 'valueOf') return () => 0;
        return blackholeProxy;
      },
      apply: () => blackholeProxy,
      set: () => true,
      construct: () => blackholeProxy
    });

    const sandbox: Record<string, any> = {
      extractedUrl: '',
      
      // محاكاة JWPlayer ذكية: تصطاد الرابط وتمتص باقي الدوال (مثل .on)
      jwplayer: () => {
        const playerInstance = new Proxy({
          setup: (conf: any) => {
            // التقاط الرابط بمجرد محاولة تشغيل الفيديو
            if (conf?.file) sandbox.extractedUrl = conf.file;
            else if (conf?.sources?.[0]?.file) sandbox.extractedUrl = conf.sources[0].file;
            // إرجاع المشغل نفسه للسماح بسلسلة الاستدعاءات (مثلاً jwplayer().setup().on())
            return playerInstance;
          }
        }, {
          get: (target: any, prop: string | symbol) => {
            // إذا طلب الدالة setup نعطيها له، غير ذلك نرسله للثقب الأسود (ليتجاوز .on وغيرها بصمت)
            if (prop in target) return target[prop as keyof typeof target];
            return blackholeProxy;
          }
        });
        return playerInstance;
      },

      // حماية كائنات المتصفح الأساسية (document و window)
      document: new Proxy({
        getElementById: () => blackholeProxy,
        querySelector: () => blackholeProxy,
      }, {
        get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy
      }),
      window: new Proxy({
        location: { href: '' }
      }, {
        get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy
      }),
      navigator: blackholeProxy,
      
      // دوال فك التشفير الأساسية
      atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
      btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    };

    // 5. تشغيل السكربت في البيئة المحمية
    vm.createContext(sandbox);
    vm.runInContext(targetScript + ';', sandbox);

    if (!sandbox.extractedUrl) {
      return NextResponse.json({ error: 'اكتمل السكربت ولكن لم يتم العثور على رابط البث' }, { status: 500 });
    }

    return NextResponse.json({ streamUrl: sandbox.extractedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
