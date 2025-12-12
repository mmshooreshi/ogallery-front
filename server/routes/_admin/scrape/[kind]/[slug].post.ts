// server/routes/_admin/scrape/[kind]/[slug].post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { OGalleryScraper, ScraperConfig } from '~~/server/lib/ogallery/engine';
import { Configs } from '~~/server/lib/ogallery/configs';
import type { ScraperConfigOverride } from '~~/server/lib/ogallery/overrides'

function buildConfig(
  base: ScraperConfig,
  override?: ScraperConfigOverride
): ScraperConfig {
  return {
    ...base,
    paths: {
      ...base.paths,
      ...override?.paths,
    },
  }
}




export default defineEventHandler(async (event) => {
  const kindParam = getRouterParam(event, 'kind') as keyof typeof Configs;
  const slug = getRouterParam(event, 'slug'); 

  const Config = Configs[kindParam];
  const body = await readBody<{ override?: ScraperConfigOverride }>(event)

  const config = buildConfig(Config, body?.override)

  if (!config) {
    throw createError({ statusCode: 400, message: `Invalid kind: ${kindParam}` });
  }

  const engine = new OGalleryScraper(config);
  
  if (!slug || slug === 'list') {
    // URL: /_admin/scrape/artists/list or /_admin/scrape/exhibitions/list
    const items = await engine.fetchList();
    return { kind: config.type, items };
  } else {
    // URL: /_admin/scrape/artists/{slug}
    const result = await engine.scrapeDetail(slug);
    
    return {
      success: true,
      kind: config.type,
      data: result.data,
      logs: result.logs
    };
  }
});