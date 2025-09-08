import { d as defineEventHandler, q as queryCollection } from '../../../nitro/nitro.mjs';
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

const exhibitions_get = defineEventHandler(async (event) => {
  const items = await queryCollection(event, "exhibitions").select("slug").all();
  return items.map((i) => i.slug);
});

export { exhibitions_get as default };
//# sourceMappingURL=exhibitions.get.mjs.map
