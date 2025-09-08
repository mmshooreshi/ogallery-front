<!-- components/SmartHamburger.vue -->
<template>
  <button
    ref="btn"
    type="button"
    class="ham"
    :class="[variant, { active: modelValue, hamRotate: rotateOnActive === 45, hamRotate180: rotateOnActive === 180 }]"
    :style="{ '--size': `${size}px` }"
    :aria-pressed="modelValue ? 'true' : 'false'"
    :aria-label="ariaLabel"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  >
    <!-- We DO NOT rewrite the SVG; we inline the exact file so we can animate it. -->
    <span class="svg" v-html="svgRaw" />
  </button>
</template>

<script setup lang="ts">
/**
 * Uses EXACT svg from ~/assets/icons/hamburger.svg
 * We measure each <path>'s total length and drive dasharray/offsets via CSS variables,
 * so offsets are always correct even if the source paths change.
 */
import svgRaw from '~/assets/icons/hamburger.svg?raw'
import { onMounted, ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  variant?: 'ham1' | 'ham8'
  size?: number
  rotateOnActive?: 45 | 180 | null
  ariaLabel?: string
}>(), {
  modelValue: false,
  variant: 'ham1',
  size: 28,
  rotateOnActive: 45,
  ariaLabel: 'Toggle menu'
})

const emit = defineEmits<{ (e:'update:modelValue', v:boolean):void, (e:'toggle', v:boolean):void }>()
const btn = ref<HTMLButtonElement | null>(null)

function toggle() {
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('toggle', next)
}

/** Measure path lengths once the SVG is rendered and set CSS vars. */
onMounted(async () => {
  await nextTick()
  const el = btn.value
  if (!el) return
  const paths = el.querySelectorAll('svg path')
  if (paths.length !== 3) return // expect 3 paths (top, middle, bottom)

  // Compute and set vars per path
  paths.forEach((p, i) => {
    const L = (p as SVGPathElement).getTotalLength()
    el.style.setProperty(`--l${i+1}`, `${L}`) // raw lengths for reference

    // Baseline visible segment per path (ratios chosen to match ham1/ham8 styles)
    // These are *ratios*, so they scale with any SVG.
    const visible =
      i === 0 ? L * 0.225 :  // top
      i === 1 ? L * 1.0   :  // middle (no dash by default)
                L * 0.19     // bottom
    el.style.setProperty(`--v${i+1}`, `${visible}`)

    // Offsets for "open" state (negative to push the dash past start)
    const off =
      i === 0 ? -(L * 0.55) :
      i === 1 ? 0 :
                -(L * 0.63)
    el.style.setProperty(`--o${i+1}`, `${off}`)
  })
})
</script>

<style scoped>
/* Button frame */
.ham {
  --size: 28px;
  appearance: none;
  border: 0;
  background: transparent;
  width: calc(var(--size) + 8px);
  height: calc(var(--size) + 8px);
  padding: 4px;
  cursor: pointer;
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #595A5C;             /* you can override by setting color on the button */
  transition: transform 400ms;
  -webkit-tap-highlight-color: transparent;
}
.ham:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }

.svg :deep(svg) {
  width: var(--size);
  height: var(--size);
  display: block;
  overflow: visible;          /* avoids clipping of rounded caps on iOS */
}
.svg :deep(svg path) {
  /* override stroke color if needed */
  stroke: currentColor;
  stroke-linecap: round;
  transition:
    stroke-dasharray 400ms,
    stroke-dashoffset 400ms,
    transform 400ms;
  transform-box: fill-box;
  transform-origin: 50% 50%;
}

/* Rotate helpers like originals */
.hamRotate.active   { transform: rotate(45deg); }
.hamRotate180.active{ transform: rotate(180deg); }

/* ---------- shared mapping to the three paths ---------- */
/* top / middle / bottom */
.ham :deep(svg path:nth-child(1)) { /* top */ }
.ham :deep(svg path:nth-child(2)) { /* middle */ }
.ham :deep(svg path:nth-child(3)) { /* bottom */ }

/* ========================= ham1 ========================= */
/* closed base state — show fixed-length segment on top & bottom */
.ham.ham1 :deep(svg path:nth-child(1)) { stroke-dasharray: var(--v1) calc(var(--l1) - var(--v1)); }
.ham.ham1 :deep(svg path:nth-child(3)) { stroke-dasharray: var(--v3) calc(var(--l3) - var(--v3)); }
/* open: push segments further (values are measured ratios; no hard-coded px) */
.ham.ham1.active :deep(svg path:nth-child(1)) { stroke-dashoffset: var(--o1); }
.ham.ham1.active :deep(svg path:nth-child(3)) { stroke-dashoffset: var(--o3); }

/* Hover polish (subtle) */
.ham.ham1:not(.active):hover :deep(svg path:nth-child(1)),
.ham.ham1:not(.active):hover :deep(svg path:nth-child(3)) { stroke-dashoffset: calc(var(--o1) * .12); }
.ham.ham1.active:hover :deep(svg path:nth-child(1)) { stroke-dashoffset: calc(var(--o1) * 1.12); }
.ham.ham1.active:hover :deep(svg path:nth-child(3)) { stroke-dashoffset: calc(var(--o3) * 1.12); }

/* ========================= ham8 ========================= */
/* top & bottom use shorter visible segment; middle rotates on open */
.ham.ham8 :deep(svg path:nth-child(1)) { stroke-dasharray: calc(var(--l1) * .20) calc(var(--l1) * .80); }
.ham.ham8 :deep(svg path:nth-child(3)) { stroke-dasharray: calc(var(--l3) * .20) calc(var(--l3) * .80); }
.ham.ham8.active :deep(svg path:nth-child(1)) { stroke-dashoffset: calc(var(--l1) * -.32); }
.ham.ham8.active :deep(svg path:nth-child(2)) { transform: rotate(90deg); }
.ham.ham8.active :deep(svg path:nth-child(3)) { stroke-dashoffset: calc(var(--l3) * -.32); }

/* Hover for ham8 */
.ham.ham8:not(.active):hover :deep(svg path:nth-child(1)),
.ham.ham8:not(.active):hover :deep(svg path:nth-child(3)) { stroke-dashoffset: calc(var(--l1) * -.06); }
.ham.ham8.active:hover  :deep(svg path:nth-child(2)) { transform: rotate(100deg); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ham, .svg :deep(svg path) { transition: none !important; }
}
</style>
