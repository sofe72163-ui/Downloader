import { NextResponse } from 'next/server';
import vm from 'vm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'الرجاء إدخال رابط الحلقة' }, { status: 400 });
    }

    // تمويه احترافي (Stealth Headers) لإقناع Cloudflare أننا متصفح حقيقي
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    };
    
    const res1 = await fetch(url, { headers });
    const html1 = await res1.text();

    // فحص إذا كان كلاودفلير لا يزال يغلق الطريق
    if (html1.includes('Just a moment') || html1.includes('cloudflare')) {
      return NextResponse.json({ error: 'حماية كلاودفلير منعت السيرفر من الدخول لصفحة الفيلم' }, { status: 403 });
    }

    const playerMatch = html1.match(/(https?:\/\/[^"'\s]+\/video_player\?player_token=[^"'\s]+)/);
    const playerUrl = playerMatch?.[1];
    if (!playerUrl) {
      return NextResponse.json({ error: 'لم يتم العثور على مشغل الفيديو (تأكد أن الرابط يخص فيلم وليس بوستر)' }, { status: 404 });
    }

    const res2 = await fetch(playerUrl, { headers: { ...headers, Referer: url } });
    const html2 = await res2.text();

    const scripts = html2.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let targetScript = '';
    for (const s of scripts) {
      const clean = s.replace(/<\/?script[^>]*>/gi, '');
      if (clean.includes('_0x')) targetScript += clean + '\n';
    }

    if (!targetScript) {
      return NextResponse.json({ error: 'لم يتم العثور على الكود المشفر للمشغل' }, { status: 404 });
    }

    const blackholeProxy: any = new Proxy(function() {}, {
      get: (target: any, prop: string | symbol) => {
        if (prop === Symbol.toPrimitive || prop === 'toString') return () => '';
        if (prop === 'valueOf') return () => 0;
        return blackholeProxy;
      },
      apply: () => blackholeProxy,
      set: () => true,
      construct: () => blackholeProxy
    });

    const jqueryMock: any = new Proxy(function(arg: any) {
      if (typeof arg === 'function') {
        try { arg(); } catch (e) {}
      }
      return jqueryMock;
    }, {
      get: (target: any, prop: string | symbol) => {
        if (prop === 'ready') {
          return (fn: any) => {
            if (typeof fn === 'function') {
              try { fn(); } catch (e) {}
            }
            return jqueryMock;
          };
        }
        if (prop === Symbol.toPrimitive || prop === 'toString') return () => '';
        if (prop === 'valueOf') return () => 0;
        return blackholeProxy;
      },
      apply: (target: any, thisArg: any, args: any[]) => {
        if (typeof args[0] === 'function') {
          try { args[0](); } catch (e) {}
        }
        return jqueryMock;
      },
      set: () => true
    });

    const sandbox: Record<string, any> = {
      extractedUrl: '',
      jwplayer: () => {
        const playerInstance = new Proxy({
          setup: (conf: any) => {
            if (conf?.file) sandbox.extractedUrl = conf.file;
            else if (conf?.sources?.[0]?.file) sandbox.extractedUrl = conf.sources[0].file;
            return playerInstance;
          }
        }, {
          get: (target: any, prop: string | symbol) => {
            if (prop in target) return target[prop as keyof typeof target];
            return blackholeProxy;
          }
        });
        return playerInstance;
      },
      $: jqueryMock,
      jQuery: jqueryMock,
      document: new Proxy({
        getElementById: () => blackholeProxy,
        querySelector: () => blackholeProxy,
      }, {
        get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy
      }),
      window: new Proxy({ location: { href: '' } }, {
        get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy
      }),
      navigator: blackholeProxy,
      atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
      btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    };

    vm.createContext(sandbox);
    vm.runInContext(targetScript + ';', sandbox);

    if (!sandbox.extractedUrl) {
      return NextResponse.json({ error: 'تم فك التشفير ولكن لم يتم العثور على رابط البث' }, { status: 500 });
    }

    return NextResponse.json({ streamUrl: sandbox.extractedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
