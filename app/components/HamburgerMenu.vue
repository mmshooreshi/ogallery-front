<!-- app/components/HamburgerMenu.vue -->
<template>
  <button
    class="ham-btn"
    type="button"
    @click="$emit('update:modelValue', !modelValue)"
    :aria-pressed="modelValue.toString()"
    aria-label="Toggle menu"
  >
    <svg
      :viewBox="viewBox"
      :width="size"
      :height="size"
      class="menu-icon"
      :class="[variant, { active: modelValue, rotateOnActive }]"
    >
      <!-- ham1 -->
      <template v-if="variant === 'ham1'">
        <path
          class="line top"
          :stroke="color"
          :stroke-width="strokeWidth"
          d="m 30,33 h 40 c 0,0 9.044436,-0.654587 9.044436,-8.508902 0,-7.854315 -8.024349,-11.958003 -14.89975,-10.85914 -6.875401,1.098863 -13.637059,4.171617 -13.637059,16.368042 v 40"
        />
        <path
          class="line middle"
          :stroke="color"
          :stroke-width="strokeWidth"
          d="m 30,50 h 40"
        />
        <path
          class="line bottom"
          :stroke="color"
          :stroke-width="strokeWidth"
          d="m 30,67 h 40 c 12.796276,0 15.357889,-11.717785 15.357889,-26.851538 0,-15.133752 -4.786586,-27.274118 -16.667516,-27.274118 -11.88093,0 -18.499247,6.994427 -18.435284,17.125656 l 0.252538,40"
        />
      </template>

      
    </svg>
  </button>
</template>

<script setup>
const props = defineProps({
  /** open/close state */
  modelValue: { type: Boolean, default: false },
  /** size in px */
  size: { type: [Number, String], default: 80 }, // EXACT 80px like provided button
  /** stroke color */
  color: { type: String, default: '#000' }, // same as original
  /** stroke thickness */
  strokeWidth: { type: [Number, String], default: 5.5 }, // EXACT stroke thickness
  /** SVG viewBox */
  viewBox: { type: String, default: '0 0 100 100' },
  /** variant - for future flexibility */
  variant: { type: String, default: 'ham1' },
  /** rotate when active */
  rotateOnActive: { type: Boolean, default: true }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.ham-btn {
  font-size: 22px; /* match your button class */
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Animation when active */
.menu-icon {
  transition: transform 350ms;
}

.menu-icon.rotateOnActive.active {
  transform: rotate(45deg);
}

/* Base line styles */
.line {
  fill: none;
  stroke-linecap: round;
  transition: stroke-dasharray 350ms, stroke-dashoffset 350ms;
}

/* Ham1 animation */
.ham1 .top {
  stroke-dasharray: 40 139;
}
.ham1 .bottom {
  stroke-dasharray: 40 180;
}
.ham1.active .top {
  stroke-dashoffset: -98px;
}
.ham1.active .bottom {
  stroke-dashoffset: -138px;
}
</style>
