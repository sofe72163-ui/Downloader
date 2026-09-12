import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
const SCRAPER_API_KEY = '18b709da5bed0adaaf65b966b3e6dd1e';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ error: 'الرجاء إدخال كلمة البحث' }, { status: 400 });

  const baseUrl = 'https://web91112x.faselhdx.life';
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;
  
  // الرابط النظيف الخالي من أي إضافات تسبب رفض الحساب المجاني
  const proxyUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(searchUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    const html = await res.text();

    const $ = cheerio.load(html);
    const results: any[] = [];

    // استهداف جميع الكلاسات المحتملة بناءً على الكود الذي جلبته من الموقع
    $('.postInner, .postDiv, .post-div, .item').each((i, el) => {
      const parentA = $(el).closest('a').length ? $(el).closest('a') : $(el).find('a').first();
      const url = parentA.attr('href') || '';
      
      const title = $(el).find('.h1, .title, .post-title').text().trim() || parentA.find('img').attr('alt')?.trim() || '';
      
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

    if (results.length === 0) {
      // إرجاع جزء من الكود المستلم لمعرفة هل الموقع رجع كابتشا أم صفحة فارغة
      const snippet = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 150);
      return NextResponse.json({ 
        error: `لم نجد نتائج. (المحتوى المستلم: ${snippet})` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
