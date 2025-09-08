import { defineComponent, withAsyncContext, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { e as useRoute, u as useHead } from './server.mjs';
import { u as useAsyncData } from './asyncData-CKtbzrFk.mjs';
import { q as queryCollection } from './app-CALJzyel.mjs';
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
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const { data: doc } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "exhibitions-item",
      () => queryCollection("exhibitions").where({ slug: route.params.slug }).first()
    )), __temp = await __temp, __restore(), __temp);
    useHead({
      title: doc.value?.title || doc.value?.name || "Exhibition"
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(doc)) {
        _push(`<article${ssrRenderAttrs(_attrs)}><h1 class="text-3xl font-semibold mb-2">${ssrInterpolate(unref(doc).title || unref(doc).name)}</h1><p class="opacity-70 mb-6">${ssrInterpolate(unref(doc).startDate || unref(doc).date)} `);
        if (unref(doc).endDate) {
          _push(`<span> — ${ssrInterpolate(unref(doc).endDate)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p>`);
        if (unref(doc).pressRelease || unref(doc).text) {
          _push(`<div class="prose max-w-none"><!--[-->`);
          ssrRenderList((unref(doc).pressRelease || unref(doc).text || "").split("\n\n"), (p) => {
            _push(`<p>${ssrInterpolate(p)}</p>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</article>`);
      } else {
        _push(`<p${ssrRenderAttrs(_attrs)}>Not found.</p>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/exhibitions/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-3sB8pRrN.mjs.map
