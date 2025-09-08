import { d as defineEventHandler, b as getRequestURL, q as queryCollection } from '../../../nitro/nitro.mjs';
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

const __get = defineEventHandler(async (event) => {
  const map = (base, rows) => rows.map((i) => `/${base}/${i.slug}`);
  if (getRequestURL(event).pathname.endsWith("/artists")) {
    return map("artists", await queryCollection(event, "artists").all());
  }
  if (getRequestURL(event).pathname.endsWith("/exhibitions")) {
    return map("exhibitions", await queryCollection(event, "exhibitions").all());
  }
  if (getRequestURL(event).pathname.endsWith("/window")) {
    return map("window", await queryCollection(event, "window").all());
  }
  if (getRequestURL(event).pathname.endsWith("/viewing-rooms")) {
    return map("viewing-rooms", await queryCollection(event, "viewingRooms").all());
  }
  if (getRequestURL(event).pathname.endsWith("/publications")) {
    return map("publications", await queryCollection(event, "publications").all());
  }
  if (getRequestURL(event).pathname.endsWith("/news")) {
    return map("news", await queryCollection(event, "news").all());
  }
  return [];
});

export { __get as default };
//# sourceMappingURL=_.get.mjs.map
