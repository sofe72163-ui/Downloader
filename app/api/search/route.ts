import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
const SCRAPER_API_KEY = '18b709da5bed0adaaf65b966b3e6dd1e';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ error: 'الرجاء إدخال كلمة البحث' }, { status: 400 });

  const baseUrl = 'https://web9120x.faselhdx.life';
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;
  
  // 🔴 السحر هنا: أضفنا &premium=true لتشغيل بروكسي الأجهزة الحقيقية (Residential)
  const proxyUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&premium=true&url=${encodeURIComponent(searchUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    const html = await res.text();

    const $ = cheerio.load(html);
    const results: any[] = [];

    $('.postInner').each((i, el) => {
      const parentA = $(el).closest('a');
      const url = parentA.attr('href') || '';
      
      const title = $(el).find('.h1').text().trim() || parentA.find('img').attr('alt')?.trim() || '';
      
      let image = parentA.find('img').attr('data-src') || parentA.find('img').attr('src') || '';
      
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season') || url.includes('episode');

      if (title && url) {
        if (!results.some(r => r.url === url)) {
          results.push({ title, url, image, isSeries });
        }
      }
    });

    // الكاشف الذكي: إذا القائمة فارغة، سيعرض لك ماذا رأى السيرفر في الصفحة
    if (results.length === 0) {
      const pageTitle = $('title').text().trim() || 'بدون عنوان';
      // جلب أول 100 حرف من محتوى الصفحة لمعرفة هل هي حماية أم صفحة فارغة
      const snippet = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 100);
      return NextResponse.json({ 
        error: `لم نجد نتائج. (العنوان: ${pageTitle} | المحتوى: ${snippet})` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
