import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
const SCRAPER_API_KEY = '18b709da5bed0adaaf65b966b3e6dd1e';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ error: 'الرجاء إدخال كلمة البحث' }, { status: 400 });

  // 🔴🔴🔴 ركز هنا 🔴🔴🔴
  // غير هذا الرابط إلى الرابط الحقيقي والفعال للموقع (بدون / في النهاية)
  const baseUrl = 'https://web91112x.faselhdx.life'; 
  
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;
  
  const proxyUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(searchUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    const html = await res.text();

    const $ = cheerio.load(html);
    const results: any[] = [];

    // وسعنا كلاسات البحث لتشمل قوالب إضافية لضمان اصطياد النتائج
    $('.post-div, .item, .movie, .post, .col-md-2, .col-sm-4, .col-6, .h-block, .postDiv').each((i, el) => {
      const title = $(el).find('.title, .post-title, h2, h3, h1, div[class*="title"]').text().trim();
      const url = $(el).find('a').attr('href') || '';
      let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
      
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season') || url.includes('episode');

      if (title && url) {
        results.push({ title, url, image, isSeries });
      }
    });

    if (results.length === 0) {
      // الكاشف: سيعرض لك عنوان الصفحة التي دخلها الوسيط لتعرف ما حدث بالضبط
      const pageTitle = $('title').text().trim() || 'بدون عنوان';
      return NextResponse.json({ 
        error: `لم نجد نتائج. (عنوان الصفحة المسحوبة: ${pageTitle}) - تأكد من أن baseUrl هو الرابط الصحيح للموقع.` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
