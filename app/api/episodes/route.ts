import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  
  if (!url) return NextResponse.json({ error: 'الرجاء إرسال رابط المسلسل' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const episodes: any[] = [];

    $('.episodes-card a, .season-episodes a, .episode a').each((i, el) => {
      const epTitle = $(el).text().trim() || `حلقة ${i + 1}`;
      const epUrl = $(el).attr('href');

      if (epUrl) {
        episodes.push({ title: epTitle, url: epUrl });
      }
    });

    return NextResponse.json({ episodes: episodes.reverse() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
