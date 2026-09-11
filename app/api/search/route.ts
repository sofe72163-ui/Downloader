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
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const results: any[] = [];

    $('.post-div').each((i, el) => {
      const title = $(el).find('.title, .post-title').text().trim();
      const url = $(el).find('a').attr('href') || '';
      const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
      
      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season');

      if (title && url) {
        results.push({ title, url, image, isSeries });
      }
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
