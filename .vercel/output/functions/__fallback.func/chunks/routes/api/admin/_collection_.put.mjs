import { d as defineEventHandler, e as ensureColl, g as getRouterParams, r as readBody, c as createError, u as useStorage, p as pathFor, t as toFileContents } from '../../../nitro/nitro.mjs';
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

const _collection__put = defineEventHandler(async (event) => {
  const coll = ensureColl(getRouterParams(event).collection);
  const body = await readBody(event);
  const slug = String((body == null ? void 0 : body.slug) || "").trim();
  if (!slug) throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  if (coll === "exhibitions" && typeof body.artists === "string") {
    body.artists = body.artists.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const storage = useStorage("content");
  await storage.setItem(pathFor(coll, slug), toFileContents(coll, body));
  return body;
});

export { _collection__put as default };
//# sourceMappingURL=_collection_.put.mjs.map
