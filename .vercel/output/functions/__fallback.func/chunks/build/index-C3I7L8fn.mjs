import { _ as __nuxt_component_0 } from './nuxt-link-CzaA5aTm.mjs';
import { I as ImageComponent } from './NuxtImg-CshGviAU.mjs';
import { defineComponent, withAsyncContext, computed, unref, withCtx, createTextVNode, toDisplayString, createBlock, createCommentVNode, createVNode, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { u as useAsyncData } from './asyncData-CKtbzrFk.mjs';
import { q as queryCollection } from './app-CALJzyel.mjs';
import { u as useHead, e as useRoute } from './server.mjs';
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
import 'perfect-debounce';
import 'pinia';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("artists", () => queryCollection("artists").all())), __temp = await __temp, __restore(), __temp);
    useHead({
      title: "Artists"
    });
    const route = useRoute();
    const q = computed(() => String(route.query.q ?? "").trim().toLowerCase());
    const letter = computed(() => String(route.query.letter ?? "").trim().toUpperCase());
    const items = computed(() => {
      const list = (data.value ?? []).slice();
      list.sort((a, b) => (a?.sortIndex ?? 1e9) - (b?.sortIndex ?? 1e9) || String(a?.name || "").localeCompare(b?.name || ""));
      const byQ = q.value ? list.filter((it) => String(it?.name || "").toLowerCase().includes(q.value)) : list;
      return letter.value ? byQ.filter((it) => String(it?.name || "").toUpperCase().startsWith(letter.value)) : byQ;
    });
    const initials = computed(() => {
      const set = new Set((data.value ?? []).map((it) => String(it?.name || "").charAt(0).toUpperCase()).filter(Boolean));
      return Array.from(set).sort();
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_NuxtImg = ImageComponent;
      _push(`<section${ssrRenderAttrs(_attrs)}><header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><h1 class="text-2xl font-semibold">Artists</h1><form class="flex gap-2 items-center"><input name="q"${ssrRenderAttr("value", _ctx.$route.query.q || "")} placeholder="Search artists…" class="border rounded px-3 py-2 text-sm w-56"><button class="border rounded px-3 py-2 text-sm">Search</button></form></header>`);
      if (unref(initials).length) {
        _push(`<nav class="flex flex-wrap gap-2 mb-6 text-sm">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: ["px-2 py-1 border rounded", { "bg-black text-white": !unref(letter) }],
          to: { query: { ..._ctx.$route.query, letter: void 0 } }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`All`);
            } else {
              return [
                createTextVNode("All")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<!--[-->`);
        ssrRenderList(unref(initials), (ch) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: ch,
            class: ["px-2 py-1 border rounded", { "bg-black text-white": unref(letter) === ch }],
            to: { query: { ..._ctx.$route.query, letter: ch } }
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(ch)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(ch), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(items).length) {
        _push(`<ul class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"><!--[-->`);
        ssrRenderList(unref(items), (doc) => {
          _push(`<li class="flex items-center gap-3">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/artists/${doc.slug}`,
            class: "group flex items-center gap-3"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (doc.image) {
                  _push2(ssrRenderComponent(_component_NuxtImg, {
                    src: doc.image,
                    width: "64",
                    height: "64",
                    class: "rounded-full object-cover",
                    alt: doc.name
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="font-medium group-hover:underline"${_scopeId}>${ssrInterpolate(doc.name)}</span>`);
              } else {
                return [
                  doc.image ? (openBlock(), createBlock(_component_NuxtImg, {
                    key: 0,
                    src: doc.image,
                    width: "64",
                    height: "64",
                    class: "rounded-full object-cover",
                    alt: doc.name
                  }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                  createVNode("span", { class: "font-medium group-hover:underline" }, toDisplayString(doc.name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul>`);
      } else {
        _push(`<p class="opacity-70">No artists found.</p>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/artists/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-C3I7L8fn.mjs.map
