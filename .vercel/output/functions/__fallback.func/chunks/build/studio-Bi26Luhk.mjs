import { defineComponent, withAsyncContext, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { u as useAsyncData } from './asyncData-CKtbzrFk.mjs';
import { q as queryCollection } from './app-CALJzyel.mjs';
import 'perfect-debounce';
import './server.mjs';
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
  __name: "studio",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: items } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "studio",
      () => queryCollection("studio").all()
    )), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(_attrs)}><h1 class="text-2xl font-semibold mb-4">Studio (Available Works)</h1><ul class="grid gap-2"><!--[-->`);
      ssrRenderList(unref(items), (it) => {
        _push(`<li>${ssrInterpolate(it.artist)} — ${ssrInterpolate(it.title)} <b class="ml-2">${ssrInterpolate(it.price)}</b><small>(${ssrInterpolate(it.availability || "available")})</small></li>`);
      });
      _push(`<!--]--></ul></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/studio.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=studio-Bi26Luhk.mjs.map
