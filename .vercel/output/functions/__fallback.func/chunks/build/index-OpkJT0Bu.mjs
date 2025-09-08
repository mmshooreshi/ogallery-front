import { _ as __nuxt_component_0 } from './nuxt-link-CzaA5aTm.mjs';
import { defineComponent, withAsyncContext, computed, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { u as useAsyncData } from './asyncData-CKtbzrFk.mjs';
import { q as queryCollection } from './app-CALJzyel.mjs';
import { u as useHead } from './server.mjs';
import 'perfect-debounce';
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
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "news",
      () => queryCollection("news").all()
    )), __temp = await __temp, __restore(), __temp);
    useHead({
      title: "News"
    });
    const items = computed(() => {
      const list = (data.value ?? []).slice();
      list.sort((a, b) => (b?.date || "").localeCompare(a?.date || ""));
      return list;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<section${ssrRenderAttrs(_attrs)}><h1 class="text-2xl font-semibold mb-4">News</h1><ul class="grid gap-3"><!--[-->`);
      ssrRenderList(unref(items), (doc) => {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/news/${doc.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(doc.title || doc.slug)}`);
            } else {
              return [
                createTextVNode(toDisplayString(doc.title || doc.slug), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`<small class="block opacity-60">${ssrInterpolate(doc.date)}</small></li>`);
      });
      _push(`<!--]--></ul></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/news/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-OpkJT0Bu.mjs.map
