import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { e as useRoute, f as useRouter } from './server.mjs';
import { u as useAdminAuth } from './useAdminAuth-bom04XpD.mjs';
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
import 'better-sqlite3';
import 'node:url';
import 'ipx';
import 'pinia';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    useRouter();
    useAdminAuth();
    const password = ref("");
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen grid place-items-center p-6" }, _attrs))}><form class="w-full max-w-sm border rounded-2xl p-6 shadow"><h1 class="text-2xl font-semibold mb-4">Admin Login</h1><label class="block text-sm mb-2">Password</label><input${ssrRenderAttr("value", unref(password))} type="password" class="w-full border rounded px-3 py-2 mb-4"><button class="w-full rounded px-3 py-2 bg-black text-white">Sign in</button>`);
      if (unref(error)) {
        _push(`<p class="text-red-600 text-sm mt-3">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</form></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-ozfOv3UL.mjs.map
