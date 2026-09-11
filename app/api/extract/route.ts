import { NextResponse } from 'next/server';
import vm from 'vm';

export const runtime = 'nodejs';
const SCRAPER_API_KEY = '18b709da5bed0adaaf65b966b3e6dd1e';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'الرجاء إدخال رابط الحلقة' }, { status: 400 });
    }

    // جلب صفحة الفيلم عبر ScraperAPI
    const proxyUrl1 = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
    const res1 = await fetch(proxyUrl1);
    const html1 = await res1.text();

    const playerMatch = html1.match(/(https?:\/\/[^"'\s]+\/video_player\?player_token=[^"'\s]+)/);
    const playerUrl = playerMatch?.[1];
    if (!playerUrl) {
      return NextResponse.json({ error: 'لم يتم العثور على مشغل الفيديو (تأكد أن الرابط صحيح)' }, { status: 404 });
    }

    // جلب كود المشغل مع الحفاظ على الهويات المطلوبة (keep_headers)
    const proxyUrl2 = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&keep_headers=true&url=${encodeURIComponent(playerUrl)}`;
    const res2 = await fetch(proxyUrl2, {
      headers: { 'Referer': url }
    });
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
        if (prop === 'ready') return (fn: any) => { if (typeof fn === 'function') { try { fn(); } catch (e) {} } return jqueryMock; };
        if (prop === Symbol.toPrimitive || prop === 'toString') return () => '';
        if (prop === 'valueOf') return () => 0;
        return blackholeProxy;
      },
      apply: (target: any, thisArg: any, args: any[]) => {
        if (typeof args[0] === 'function') { try { args[0](); } catch (e) {} }
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
          get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy
        });
        return playerInstance;
      },
      $: jqueryMock,
      jQuery: jqueryMock,
      document: new Proxy({
        getElementById: () => blackholeProxy,
        querySelector: () => blackholeProxy,
      }, { get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy }),
      window: new Proxy({ location: { href: '' } }, { get: (target: any, prop: string | symbol) => prop in target ? target[prop as keyof typeof target] : blackholeProxy }),
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
