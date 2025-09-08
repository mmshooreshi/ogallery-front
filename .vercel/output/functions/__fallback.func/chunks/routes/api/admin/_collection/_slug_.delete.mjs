import { d as defineEventHandler, g as getRouterParams, u as useStorage, p as pathFor, e as ensureColl } from '../../../../nitro/nitro.mjs';
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

const _slug__delete = defineEventHandler(async (event) => {
  const { collection, slug } = getRouterParams(event);
  const storage = useStorage("content");
  await storage.removeItem(pathFor(ensureColl(collection), String(slug)));
  return { ok: true };
});

export { _slug__delete as default };
//# sourceMappingURL=_slug_.delete.mjs.map
