import { d as defineEventHandler, r as readBody, c as createError, u as useStorage, e as ensureColl, p as pathFor, t as toFileContents } from '../../../nitro/nitro.mjs';
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

const import_post = defineEventHandler(async (event) => {
  const data = await readBody(event);
  if (!data || typeof data !== "object") throw createError({ statusCode: 400, statusMessage: "Invalid JSON" });
  const storage = useStorage("content");
  for (const [collection, items] of Object.entries(data)) {
    const coll = ensureColl(collection);
    for (const item of items) {
      await storage.setItem(pathFor(coll, String(item.slug)), toFileContents(coll, item));
    }
  }
  return { ok: true };
});

export { import_post as default };
//# sourceMappingURL=import.post.mjs.map
