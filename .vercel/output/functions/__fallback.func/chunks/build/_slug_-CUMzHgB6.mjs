import { I as ImageComponent } from './NuxtImg-CshGviAU.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-CzaA5aTm.mjs';
import { defineComponent, computed, withAsyncContext, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList } from 'vue/server-renderer';
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
    const slug = computed(() => String(route.params.slug ?? ""));
    const { data, pending, error } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      () => `artist-${slug.value}`,
      () => queryCollection("artists").where("slug", "=", slug.value).first(),
      { watch: [slug] }
    )), __temp = await __temp, __restore(), __temp);
    const artist = computed(() => data.value ?? null);
    useHead({
      title: () => artist.value?.name ?? "Artist",
      meta: [
        { property: "og:title", content: () => artist.value?.name ?? "Artist" },
        { name: "description", content: () => (artist.value?.bio || "").slice(0, 160) }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtImg = ImageComponent;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<section${ssrRenderAttrs(_attrs)}>`);
      if (unref(pending)) {
        _push(`<div class="opacity-70">Loading…</div>`);
      } else if (unref(error)) {
        _push(`<div class="text-red-600">Failed to load artist.</div>`);
      } else if (unref(artist)) {
        _push(`<article><header class="mb-6 flex items-center gap-4">`);
        if (unref(artist).image) {
          _push(ssrRenderComponent(_component_NuxtImg, {
            src: unref(artist).image,
            width: "120",
            height: "120",
            class: "rounded-full object-cover",
            alt: unref(artist).name
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div><h1 class="text-3xl font-semibold mb-2">${ssrInterpolate(unref(artist).name)}</h1>`);
        if (unref(artist).website) {
          _push(`<a${ssrRenderAttr("href", unref(artist).website)} target="_blank" rel="noopener" class="text-sm underline opacity-80 hover:opacity-100">${ssrInterpolate(unref(artist).website)}</a>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header>`);
        if (unref(artist).bio) {
          _push(`<div class="prose max-w-none"><!--[-->`);
          ssrRenderList(unref(artist).bio.split("\n\n"), (p, i) => {
            _push(`<p>${ssrInterpolate(p)}</p>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<p class="opacity-70">Biography coming soon.</p>`);
        }
        _push(`</article>`);
      } else {
        _push(`<p class="opacity-70">Artist not found.</p>`);
      }
      _push(`<footer class="mt-8">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/artists",
        class: "text-sm underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`← All artists`);
          } else {
            return [
              createTextVNode("← All artists")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</footer></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/artists/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-CUMzHgB6.mjs.map
