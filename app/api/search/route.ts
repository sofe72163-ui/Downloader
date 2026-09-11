import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ error: 'الرجاء إدخال كلمة البحث' }, { status: 400 });

  const baseUrl = 'https://web91112x.faselhdx.life';
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;

  try {
    // استخدمنا خدمة AllOrigins كـ وسيط (كوبري) لتخطي حظر Cloudflare لسيرفرات Vercel
    const bypassUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
    
    const res = await fetch(bypassUrl);
    const data = await res.json();
    
    // صفحة الويب الحقيقية ستكون بداخل المتغير contents
    const html = data.contents;
    
    if (!html) throw new Error('فشل جلب الصفحة من الوسيط');

    const $ = cheerio.load(html);
    const results: any[] = [];

    $('.post-div, .item, .movie, .post, .col-md-2, .col-sm-4, .col-6, .h-block').each((i, el) => {
      const title = $(el).find('.title, .post-title, h2, h3').text().trim();
      const url = $(el).find('a').attr('href') || '';
      let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
      
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season');

      if (title && url) {
        results.push({ title, url, image, isSeries });
      }
    });

    if (results.length === 0) {
      const pageTitle = $('title').text().trim() || 'بدون عنوان';
      return NextResponse.json({ 
        error: `لم نجد نتائج. (إذا كان العنوان Just a moment فهذا يعني أن كلاودفلير حظر الوسيط أيضاً)` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
