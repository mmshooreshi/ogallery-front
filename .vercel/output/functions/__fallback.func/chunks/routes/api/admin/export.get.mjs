import { d as defineEventHandler, a as collMap, q as queryCollection, s as setHeader } from '../../../nitro/nitro.mjs';
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

const export_get = defineEventHandler(async (event) => {
  const all = {};
  for (const key of Object.keys(collMap)) {
    const id = key === "viewingRooms" ? "viewingRooms" : key;
    all[key] = await queryCollection(event, id).all();
  }
  setHeader(event, "Content-Type", "application/json");
  return JSON.stringify(all, null, 2);
});

export { export_get as default };
//# sourceMappingURL=export.get.mjs.map
