import { defineEventHandler, readBody, createError } from 'h3';
import { $fetch } from 'ofetch';
import { load } from 'cheerio';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body?.url) {
    throw createError({ statusCode: 400, message: 'Missing URL' });
  }

  try {
    // 1. Fetch HTML with a browser-like User-Agent to avoid 403/500 blocks
    const html = await $fetch<string>(body.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
      retry: 2,
      timeout: 10000
    });

    const $ = load(html);
    const nodes: any[] = [];

    // 2. Select specific content-heavy tags
    $('h1, h2, h3, h4, p, img, a[href$=".pdf"], a.btn, .title, .caption').each((i, el) => {
      const $el = $(el);
      const tagName = el.type === 'tag' ? el.tagName.toLowerCase() : '';
      if (!tagName) return;

      // 3. Resilient Selector Generation
      let selector = tagName;
      
      const id = $el.attr('id');
      const className = $el.attr('class');

      if (id && !id.includes('__')) { // Avoid dynamic Nuxt/Next IDs
        selector = `#${id}`;
      } else if (className) {
        // Grab the first stable-looking class
        const firstClass = className.split(/\s+/)
          .filter(c => c.length > 2 && !/\d/.test(c) && !c.includes(':'))[0];
        if (firstClass) selector = `${tagName}.${firstClass}`;
      }

      // Add parent context if selector is too generic (like just "p")
      if (selector === 'p' || selector === 'img') {
        const parent = $el.parent();
        const pClass = parent.attr('class')?.split(' ')[0];
        if (pClass) selector = `.${pClass} > ${selector}`;
      }

      nodes.push({
        id: i,
        tag: tagName,
        text: $el.text().trim().substring(0, 300),
        src: $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src'),
        href: $el.attr('href'),
        selector: selector
      });
    });

    return { nodes };

  } catch (error: any) {
    console.error('[Analyze Error]:', error.message);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch page: ${error.message}. Is the URL public?`
    });
  }
});