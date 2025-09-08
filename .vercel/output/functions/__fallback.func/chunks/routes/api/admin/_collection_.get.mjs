import { d as defineEventHandler, e as ensureColl, g as getRouterParams, q as queryCollection } from '../../../nitro/nitro.mjs';
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

const _collection__get = defineEventHandler((event) => {
  const coll = ensureColl(getRouterParams(event).collection);
  const id = coll === "viewingRooms" ? "viewingRooms" : coll;
  return queryCollection(event, id).all();
});

export { _collection__get as default };
//# sourceMappingURL=_collection_.get.mjs.map
