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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const results: any[] = [];

    // وسعنا دائرة البحث لتشمل الكلاسات المشهورة في قوالب مواقع الأفلام
    $('.post-div, .item, .movie, .post, .col-md-2, .col-sm-4, .col-6, .h-block').each((i, el) => {
      const title = $(el).find('.title, .post-title, h2, h3').text().trim();
      const url = $(el).find('a').attr('href') || '';
      let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
      
      // تصليح مسار الصور إذا كان ناقص
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season');

      if (title && url) {
        results.push({ title, url, image, isSeries });
      }
    });

    // ميزة كشف المشكلة: إذا القائمة فارغة، رجع عنوان الصفحة للمستخدم
    if (results.length === 0) {
      const pageTitle = $('title').text().trim() || 'بدون عنوان';
      return NextResponse.json({ 
        error: `لم نجد نتائج. (عنوان الصفحة المسحوبة من السيرفر: ${pageTitle})` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const results: any[] = [];

    // وسعنا دائرة البحث لتشمل الكلاسات المشهورة في قوالب مواقع الأفلام
    $('.post-div, .item, .movie, .post, .col-md-2, .col-sm-4, .col-6, .h-block').each((i, el) => {
      const title = $(el).find('.title, .post-title, h2, h3').text().trim();
      const url = $(el).find('a').attr('href') || '';
      let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
      
      // تصليح مسار الصور إذا كان ناقص
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      const isSeries = url.includes('series') || url.includes('asian-') || url.includes('season');

      if (title && url) {
        results.push({ title, url, image, isSeries });
      }
    });

    // ميزة كشف المشكلة: إذا القائمة فارغة، رجع عنوان الصفحة للمستخدم
    if (results.length === 0) {
      const pageTitle = $('title').text().trim() || 'بدون عنوان';
      return NextResponse.json({ 
        error: `لم نجد نتائج. (عنوان الصفحة المسحوبة من السيرفر: ${pageTitle})` 
      }, { status: 404 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
