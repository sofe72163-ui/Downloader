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
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
    };

    const res = await fetch(searchUrl, { headers });
    const html = await res.text();

    if (html.includes('Just a moment') || html.includes('cloudflare')) {
      return NextResponse.json({ error: 'عذراً، نظام حماية الموقع (Cloudflare) حظر عملية البحث.' }, { status: 403 });
    }

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
      return NextResponse.json({ error: `لم نجد نتائج.` }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
