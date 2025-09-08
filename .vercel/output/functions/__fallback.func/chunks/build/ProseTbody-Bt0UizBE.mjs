import { ssrRenderAttrs, ssrRenderSlot } from 'vue/server-renderer';
import { useSSRContext } from 'vue';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<tbody${ssrRenderAttrs(_attrs)}>`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</tbody>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/.pnpm/@nuxtjs+mdc@0.17.0_magicast@0.3.5/node_modules/@nuxtjs/mdc/dist/runtime/components/prose/ProseTbody.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ProseTbody = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]), { __name: "ProseTbody" });

export { ProseTbody as default };
//# sourceMappingURL=ProseTbody-Bt0UizBE.mjs.map
