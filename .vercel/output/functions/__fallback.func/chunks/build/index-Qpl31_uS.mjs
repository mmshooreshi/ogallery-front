import { I as ImageComponent } from './NuxtImg-CshGviAU.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-CzaA5aTm.mjs';
import { defineComponent, withAsyncContext, computed, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
import { u as useAsyncData } from './asyncData-CKtbzrFk.mjs';
import { q as queryCollection } from './app-CALJzyel.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({
      title: "Home"
    });
    const { data: exAll } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("exhibitions", () => queryCollection("exhibitions").all())), __temp = await __temp, __restore(), __temp);
    const { data: newsAll } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("news", () => queryCollection("news").all())), __temp = await __temp, __restore(), __temp);
    const currentEx = computed(() => {
      const list = (exAll.value ?? []).slice();
      list.sort((a, b) => String(b?.startDate || "").localeCompare(String(a?.startDate || "")));
      return list.find((x) => x?.status === "current") || list[0];
    });
    const heroImage = computed(() => currentEx.value?.images?.[0] || "/images/placeholder-hero.jpg");
    const heroTitle = computed(() => currentEx.value?.title || "");
    const heroArtist = computed(() => (currentEx.value?.artists?.[0] || "").toUpperCase());
    const heroDates = computed(() => {
      const s = currentEx.value?.startDate || "", e = currentEx.value?.endDate || "";
      return s && e ? `${prettyDate(s)} – ${prettyDate(e)}` : s || e || "";
    });
    const news = computed(() => {
      const list = (newsAll.value ?? []).slice();
      list.sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));
      return list.slice(0, 6);
    });
    const showCookies = ref(false);
    function prettyDate(iso) {
      const [y, m, d] = iso.split("-").map(Number);
      const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
      return dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtImg = ImageComponent;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "home" }, _attrs))} data-v-27d80ddb><section class="hero" data-v-27d80ddb>`);
      _push(ssrRenderComponent(_component_NuxtImg, {
        src: unref(heroImage) || "/images/ph-hero.svg",
        class: "hero__img",
        alt: ""
      }, null, _parent));
      _push(`<div class="hero__overlay" data-v-27d80ddb></div><div class="hero__content" data-v-27d80ddb>`);
      if (unref(heroArtist)) {
        _push(`<p class="hero__artist" data-v-27d80ddb>${ssrInterpolate(unref(heroArtist))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<h1 class="hero__title" data-v-27d80ddb><span data-v-27d80ddb>${ssrInterpolate(unref(heroTitle))}</span></h1>`);
      if (unref(heroDates)) {
        _push(`<p class="hero__dates" data-v-27d80ddb>${ssrInterpolate(unref(heroDates))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="hero__bar" data-v-27d80ddb></div></div></section>`);
      if (unref(showCookies)) {
        _push(`<div class="cookie" data-v-27d80ddb><h3 class="cookie__title" data-v-27d80ddb>This website uses cookies</h3><p class="cookie__text" data-v-27d80ddb> This site uses cookies to help make it more useful to you. Please contact us to find out more about our Cookie Policy. </p><div class="cookie__actions" data-v-27d80ddb>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/cookies",
          class: "link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Manage cookies`);
            } else {
              return [
                createTextVNode("Manage cookies")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<button class="btn" data-v-27d80ddb>Accept</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<section class="news" data-v-27d80ddb><!--[-->`);
      ssrRenderList(unref(news), (n) => {
        _push(`<article class="news__item" data-v-27d80ddb><div class="news__text" data-v-27d80ddb><h2 class="news__title" data-v-27d80ddb>${ssrInterpolate(n.title)}</h2><p class="news__date" data-v-27d80ddb>${ssrInterpolate(new Date(n.date || "").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}</p><p class="news__teaser" data-v-27d80ddb>${ssrInterpolate(n.teaser || "")}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/news/${n.slug}`,
          class: "link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Read More`);
            } else {
              return [
                createTextVNode("Read More")
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div>`);
        _push(ssrRenderComponent(_component_NuxtImg, {
          src: n.coverImage || "/images/ph-thumb.svg",
          class: "news__image",
          alt: ""
        }, null, _parent));
        _push(`</article>`);
      });
      _push(`<!--]--></section><footer class="foot" data-v-27d80ddb><div data-v-27d80ddb>COPYRIGHT © ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} OGALLERY</div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/mailing-list",
        class: "link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`JOIN OUR MAILING LIST`);
          } else {
            return [
              createTextVNode("JOIN OUR MAILING LIST")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/cookies",
        class: "link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`MANAGE COOKIES`);
          } else {
            return [
              createTextVNode("MANAGE COOKIES")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</footer></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-27d80ddb"]]);

export { index as default };
//# sourceMappingURL=index-Qpl31_uS.mjs.map
