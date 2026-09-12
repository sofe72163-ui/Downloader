import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
const SCRAPER_API_KEY = '18b709da5bed0adaaf65b966b3e6dd1e';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ error: 'الرجاء إدخال كلمة البحث' }, { status: 400 });

  // حدثت الرابط بناءً على ما ظهر في الكود الذي أرسلته
  const baseUrl = 'https://web9120x.faselhdx.life';
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;
  
  const proxyUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&render=true&url=${encodeURIComponent(searchUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    const html = await res.text();

    const $ = cheerio.load(html);
    const results: any[] = [];

    // استهداف دقيق جداً: نبحث عن الـ postInner الذي يضم تفاصيل الفيلم
    $('.postInner').each((i, el) => {
      // نصعد للرابط الأب اللي يحتوي على صفحة الفيلم
      const parentA = $(el).closest('a');
      const url = parentA.attr('href') || '';
      
      // هنا اصطدنا الخدعة: البحث عن كلاس .h1 وليس واسم <h1>، أو أخذ العنوان من الصورة
      const title = $(el).find('.h1').text().trim() || parentA.find('img').attr('alt')?.trim() || '';
      
      // سحب بوستر الفيلم
      let image = parentA.find('img').attr('data-src') || parentA.find('img').attr('src') || '';
      
      // تعديل مسار الصورة إذا كان ناقصاً
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      // فحص هل هو مسلسل أم فيلم
      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season') || url.includes('episode');

      // إذا اكتملت الشروط، نضيفه للنتائج بدون تكرار
      if (title && url) {
        if (!results.some(r => r.url === url)) {
          results.push({ title, url, image, isSeries });
        }
      }
    });

    if (results.length === 0) {
      const pageTitle = $('title').text().trim() || 'بدون عنوان';
      return NextResponse.json({ 
        error: `لم نجد نتائج مطابقة.` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
