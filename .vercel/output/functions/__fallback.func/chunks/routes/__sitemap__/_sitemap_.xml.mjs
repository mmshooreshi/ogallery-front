import { d as defineEventHandler, R as useSitemapRuntimeConfig, T as getRouterParam, c as createError, U as withoutLeadingSlash, V as withoutTrailingSlash, W as parseChunkInfo, X as getSitemapConfig, Y as createSitemap } from '../../nitro/nitro.mjs';
import 'lru-cache';
import '@unocss/core';
import '@unocss/preset-wind3';
import 'devalue';
import 'consola';
import 'unhead';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'chokidar';
import 'anymatch';
import 'node:crypto';
import 'vue';
import '@intlify/utils';
import 'vue-router';
import '@iconify/utils';
import 'unhead/server';
import 'unhead/plugins';
import 'unhead/utils';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'better-sqlite3';
import 'node:url';
import 'ipx';

const _sitemap__xml = defineEventHandler(async (e) => {
  const runtimeConfig = useSitemapRuntimeConfig(e);
  const { sitemaps } = runtimeConfig;
  let sitemapName = getRouterParam(e, "sitemap");
  if (!sitemapName) {
    const path = e.path;
    const match = path.match(/(?:\/__sitemap__\/)?([^/]+)\.xml$/);
    if (match) {
      sitemapName = match[1];
    }
  }
  if (!sitemapName) {
    return createError({
      statusCode: 400,
      message: "Invalid sitemap request"
    });
  }
  sitemapName = withoutLeadingSlash(withoutTrailingSlash(sitemapName.replace(".xml", "").replace("__sitemap__/", "").replace(runtimeConfig.sitemapsPathPrefix || "", "")));
  const chunkInfo = parseChunkInfo(sitemapName, sitemaps, runtimeConfig.defaultSitemapsChunkSize);
  const isAutoChunked = typeof sitemaps.chunks !== "undefined" && !Number.isNaN(Number(sitemapName));
  const sitemapExists = sitemapName in sitemaps || chunkInfo.baseSitemapName in sitemaps || isAutoChunked;
  if (!sitemapExists) {
    return createError({
      statusCode: 404,
      message: `Sitemap "${sitemapName}" not found.`
    });
  }
  if (chunkInfo.isChunked && chunkInfo.chunkIndex !== void 0) {
    const baseSitemap = sitemaps[chunkInfo.baseSitemapName];
    if (baseSitemap && !baseSitemap.chunks && !baseSitemap._isChunking) {
      return createError({
        statusCode: 404,
        message: `Sitemap "${chunkInfo.baseSitemapName}" does not support chunking.`
      });
    }
    if (baseSitemap?._chunkCount !== void 0 && chunkInfo.chunkIndex >= baseSitemap._chunkCount) {
      return createError({
        statusCode: 404,
        message: `Chunk ${chunkInfo.chunkIndex} does not exist for sitemap "${chunkInfo.baseSitemapName}".`
      });
    }
  }
  const sitemapConfig = getSitemapConfig(sitemapName, sitemaps, runtimeConfig.defaultSitemapsChunkSize);
  return createSitemap(e, sitemapConfig, runtimeConfig);
});

export { _sitemap__xml as default };
//# sourceMappingURL=_sitemap_.xml.mjs.map
