import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
const SCRAPER_API_KEY = '18b709da5bed0adaaf65b966b3e6dd1e';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  
  if (!url) return NextResponse.json({ error: 'الرجاء إرسال رابط المسلسل' }, { status: 400 });

  const proxyUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(proxyUrl);
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
