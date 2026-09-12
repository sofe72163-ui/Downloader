import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ error: 'الرجاء إدخال كلمة البحث' }, { status: 400 });

  const baseUrl = 'https://web91112x.faselhdx.life';
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;
  const results: any[] = [];
  
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(searchUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(searchUrl)}`
  ];

  let html = '';
  let success = false;

  // الخطة أ: محاولة تخطي كلاودفلير بالسيرفرات البديلة
  for (const proxy of proxies) {
    if (success) break;
    try {
      const res = await fetch(proxy, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
      });
      const text = await res.text();
      if (text.includes('postInner') || text.includes('fasel')) {
        html = text;
        success = true;
      }
    } catch (err) {}
  }

  if (success) {
    const $ = cheerio.load(html);
    $('.postInner, .postDiv, .post-div, .item').each((i, el) => {
      const parentA = $(el).closest('a').length ? $(el).closest('a') : $(el).find('a').first();
      const url = parentA.attr('href') || '';
      const title = $(el).find('.h1, .title, .post-title').text().trim() || parentA.find('img').attr('alt')?.trim() || '';
      let image = parentA.find('img').attr('data-src') || parentA.find('img').attr('src') || '';
      
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season') || url.includes('episode');

      if (title && url && !results.some(r => r.url === url)) {
        results.push({ title, url, image, isSeries });
      }
    });
  }

  // الخطة ب (النووية): إذا فشلنا بسبب كلاودفلير، نسحب الروابط من محرك بحث DuckDuckGo
  if (results.length === 0) {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=site:${baseUrl}+${encodeURIComponent(query)}`;
      const ddgRes = await fetch(ddgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const ddgHtml = await ddgRes.text();
      const $ddg = cheerio.load(ddgHtml);
      
      $ddg('.result').each((i, el) => {
        const rawHref = $ddg(el).find('.result__url').attr('href') || '';
        let url = '';
        
        if (rawHref.includes('uddg=')) {
          const match = rawHref.match(/uddg=([^&]+)/);
          // هنا تم إصلاح خطأ الـ TypeScript بالتأكد من وجود match[1] كنص
          if (match && match[1]) {
            url = decodeURIComponent(match[1]);
          }
        } else {
          url = rawHref;
        }

        let title = $ddg(el).find('.result__title').text().trim();
        title = title.replace(/ – فاصل اعلاني.*/, '').replace(/ مشاهدة.*/, '').replace(/ مترجم.*/, '');
        
        if (url.includes('fasel') && title && url.length > baseUrl.length + 5) {
           const isSeries = url.includes('series') || url.includes('season');
           
           if (!results.some(r => r.url === url)) {
             results.push({ title, url, image: '', isSeries });
           }
        }
      });
    } catch (e) {}
  }

  if (results.length === 0) {
    return NextResponse.json({ error: `بحثنا بكل الطرق الممكنة ولم نجد نتيجة لـ: ${query}` }, { status: 404 });
  }

  return NextResponse.json({ results });
}
