import { ssrRenderComponent, ssrRenderAttrs, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';
import { ref, defineComponent, watch, nextTick, mergeProps, withCtx, createVNode, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-CzaA5aTm.mjs';
import { l as publicAssetsURL } from '../nitro/nitro.mjs';
import { a as useLocalePath, b as useSwitchLocalePath, d as useI18n } from './server.mjs';
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

const _sfc_main$2 = {
  __name: "HamburgerMenu",
  __ssrInlineRender: true,
  props: {
    /** open/close state */
    modelValue: { type: Boolean, default: false },
    /** size in px */
    size: { type: [Number, String], default: 80 },
    // EXACT 80px like provided button
    /** stroke color */
    color: { type: String, default: "#000" },
    // same as original
    /** stroke thickness */
    strokeWidth: { type: [Number, String], default: 5.5 },
    // EXACT stroke thickness
    /** SVG viewBox */
    viewBox: { type: String, default: "0 0 100 100" },
    /** variant - for future flexibility */
    variant: { type: String, default: "ham1" },
    /** rotate when active */
    rotateOnActive: { type: Boolean, default: true }
  },
  emits: ["update:modelValue"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        class: "ham-btn",
        type: "button",
        "aria-pressed": __props.modelValue.toString(),
        "aria-label": "Toggle menu"
      }, _attrs))} data-v-4c5a7a69><svg${ssrRenderAttr("viewBox", __props.viewBox)}${ssrRenderAttr("width", __props.size)}${ssrRenderAttr("height", __props.size)} class="${ssrRenderClass([[__props.variant, { active: __props.modelValue, rotateOnActive: __props.rotateOnActive }], "menu-icon"])}" data-v-4c5a7a69>`);
      if (__props.variant === "ham1") {
        _push(`<!--[--><path class="line top"${ssrRenderAttr("stroke", __props.color)}${ssrRenderAttr("stroke-width", __props.strokeWidth)} d="m 30,33 h 40 c 0,0 9.044436,-0.654587 9.044436,-8.508902 0,-7.854315 -8.024349,-11.958003 -14.89975,-10.85914 -6.875401,1.098863 -13.637059,4.171617 -13.637059,16.368042 v 40" data-v-4c5a7a69></path><path class="line middle"${ssrRenderAttr("stroke", __props.color)}${ssrRenderAttr("stroke-width", __props.strokeWidth)} d="m 30,50 h 40" data-v-4c5a7a69></path><path class="line bottom"${ssrRenderAttr("stroke", __props.color)}${ssrRenderAttr("stroke-width", __props.strokeWidth)} d="m 30,67 h 40 c 12.796276,0 15.357889,-11.717785 15.357889,-26.851538 0,-15.133752 -4.786586,-27.274118 -16.667516,-27.274118 -11.88093,0 -18.499247,6.994427 -18.435284,17.125656 l 0.252538,40" data-v-4c5a7a69></path><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</svg></button>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/HamburgerMenu.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const HamburgerMenu = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-4c5a7a69"]]);
const _imports_0 = publicAssetsURL("/ogallery-logo.svg");
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SiteHeader2",
  __ssrInlineRender: true,
  setup(__props) {
    const lp = useLocalePath();
    const switchLocalePath = useSwitchLocalePath();
    const { locale } = useI18n();
    const open = ref(false);
    const searchOpen = ref(false);
    function close() {
      open.value = false;
    }
    const links = [
      { to: "/artists", label: "Artists" },
      { to: "/exhibitions", label: "Exhibitions" },
      { to: "/viewing-rooms", label: "Viewing Rooms" },
      { to: "/window", label: "The Window" },
      { to: "/publications", label: "Publications" },
      { to: "/news", label: "News" },
      { to: "/studio", label: "Studio" },
      { to: "/gallery", label: "Gallery" }
    ];
    ref(null);
    const searchInputRef = ref(null);
    watch(searchOpen, async (isOpen) => {
      if (isOpen) {
        await nextTick();
        searchInputRef.value?.focus({ preventScroll: true });
        searchInputRef.value?.select();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "fixed top-0 inset-x-0 z-40 w-full h-[60px] my-[2.5px] bg-white border-b border-black/8 flex items-center" }, _attrs))}>`);
      _push(ssrRenderComponent(HamburgerMenu, {
        modelValue: open.value,
        "onUpdate:modelValue": ($event) => open.value = $event,
        variant: "ham1",
        size: 60,
        color: "#595a5c",
        "stroke-width": 3.5
      }, null, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        "aria-label": "OGallery",
        class: ["flex items-center gap-2 text-[#2d2d2d] no-underline font-600 tracking-[0.06em] transition-opacity duration-200", searchOpen.value ? "opacity-0 md:opacity-100 w-0 pointer-events-none" : "opacity-100"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="" class="h-[40px] w-auto"${_scopeId}>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "",
                class: "h-[40px] w-auto"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex-1"></div><div class="flex items-center gap-0 md:gap-0"><div class="${ssrRenderClass([searchOpen.value ? "opacity-0 pointer-events-none  md:pointer-events-auto" : "opacity-90", "flex items-center text-[#2d2d2d] text-[1rem] transition-opacity duration-200"])}">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(switchLocalePath)("en"),
        class: ["no-underline font-english", unref(locale) === "en" ? "text-[#ffde00]" : "text-inherit"],
        "aria-label": "Switch to English"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`EN`);
          } else {
            return [
              createTextVNode("EN")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span class="px-2 opacity-40">|</span>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(switchLocalePath)("fa"),
        class: ["no-underline font-persian", unref(locale) === "fa" ? "text-[#ffde00]" : "text-inherit"],
        "aria-label": "Switch to Persian"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`فا`);
          } else {
            return [
              createTextVNode("فا")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="relative flex items-center"><div class="${ssrRenderClass([searchOpen.value ? "w-[200px]" : "w-0 opacity-0", unref(locale) === "en" ? "-mr-10 ml-10" : "-ml-10 mr-10", "mx-2 h-[36px] overflow-hidden transition-all duration-300 ease-out"])}"${ssrRenderAttr("aria-hidden", searchOpen.value ? "false" : "true")}><input type="text" placeholder="Search…" class="${ssrRenderClass([searchOpen.value ? "opacity-100" : "opacity-0 pointer-events-none select-none", "h-full w-full px-3 outline-none border-t border-x-0 border-b-0 border-black/20 transition-opacity duration-1000"])}" autofocus></div><button${ssrRenderAttr("aria-pressed", searchOpen.value ? "true" : "false")} class="${ssrRenderClass([searchOpen.value ? "scale-50 mt-1" : "scale-100", "p-0 w-[60px] h-[60px] flex items-center justify-center appearance-none border-none bg-transparent cursor-pointer text-[#2d2d2d] transition-all duration-300"])}" aria-label="Toggle search"><svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.658 26.3837L20.458 19.1837C22.2763 16.9485 23.1676 14.1008 22.9482 11.2278C22.7288 8.35483 21.4154 5.67552 19.2788 3.74233C17.1421 1.80914 14.3452 0.769453 11.4647 0.837625C8.58409 0.905798 5.83949 2.07664 3.79672 4.10874C1.76462 6.1515 0.593786 8.8961 0.525613 11.7767C0.457441 14.6572 1.49713 17.4542 3.43032 19.5908C5.36351 21.7274 8.04282 23.0408 10.9158 23.2602C13.7888 23.4796 16.6365 22.5883 18.8717 20.77L26.0717 27.97C26.2869 28.1543 26.5638 28.2506 26.8469 28.2397C27.13 28.2287 27.3986 28.1113 27.599 27.911C27.7993 27.7106 27.9167 27.4421 27.9276 27.1589C27.9386 26.8758 27.8423 26.5989 27.658 26.3837ZM5.38297 18.43C4.12371 17.1715 3.26596 15.5679 2.91821 13.8219C2.57047 12.0759 2.74835 10.266 3.42937 8.62115C4.11038 6.97627 5.26393 5.57032 6.7441 4.58112C8.22427 3.59193 9.96457 3.06394 11.7448 3.06394C13.5251 3.06394 15.2654 3.59193 16.7456 4.58112C18.2258 5.57032 19.3793 6.97627 20.0603 8.62115C20.7413 10.266 20.9192 12.0759 20.5715 13.8219C20.2237 15.5679 19.366 17.1715 18.1067 18.43C17.2749 19.2718 16.2842 19.9402 15.1922 20.3964C14.1001 20.8526 12.9284 21.0875 11.7448 21.0875C10.5613 21.0875 9.3896 20.8526 8.29754 20.3964C7.20548 19.9402 6.21482 19.2718 5.38297 18.43Z" fill="#7F7F7F"></path></svg></button></div></div><div class="${ssrRenderClass([open.value ? "pointer-events-auto" : "pointer-events-none", "fixed left-0 right-0 bottom-0 top-0 bg-black/0 transition-opacity duration-200 -z-100"])}"><nav class="${ssrRenderClass([open.value ? "translate-y-0" : "-translate-y-full", "absolute p-1 left-0 inset-y-0 bg-white w-screen flex flex-col transs"])}" role="dialog" aria-modal="true" aria-label="Main Menu"><ul class="${ssrRenderClass([open.value ? "menu-open" : "menu-close", "list-none py-[1px] px-[5px] m-0 p-0 mt-[56px]"])}"><!--[-->`);
      ssrRenderList(links, (l, i) => {
        _push(`<li class="menu-item" style="${ssrRenderStyle({ "--i": i })}">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(lp)(l.to),
          onClick: close,
          class: "uppercase block py-[1px] px-[5px] w-max pr-8 no-underline font-light text-[1.4rem] text-[#1e1e1e]/70 rounded-lg hover:text-[#ffde00] transition-colors duration-200 upp"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(l.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(l.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></nav></div></header>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SiteHeader2.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const SiteHeader2 = Object.assign(_sfc_main$1, { __name: "SiteHeader2" });
const _sfc_main = {
  __name: "ham",
  __ssrInlineRender: true,
  setup(__props) {
    ref(false);
    ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[--><div class="w-screen h-[65px]">`);
      _push(ssrRenderComponent(SiteHeader2, null, null, _parent));
      _push(`</div><div class="bg-black h-screen"> body </div><!--]-->`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/ham.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=ham-DwL80Xbw.mjs.map
