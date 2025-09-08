import { h as defineNuxtRouteMiddleware, n as navigateTo } from './server.mjs';
import { u as useAdminAuth } from './useAdminAuth-bom04XpD.mjs';
import 'vue';
import '../nitro/nitro.mjs';
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
import 'pinia';

const adminAuth = defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith("/admin")) return;
  const { isAuthed } = useAdminAuth();
  if (!isAuthed.value && to.path !== "/admin/login") {
    return navigateTo("/admin/login?next=" + encodeURIComponent(to.fullPath));
  }
});

export { adminAuth as default };
//# sourceMappingURL=admin-auth-GimjfVHM.mjs.map
