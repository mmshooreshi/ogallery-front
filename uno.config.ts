// uno.config.ts
import { defineConfig, presetUno, presetAttributify, presetIcons, presetTypography, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.1 }),
    presetTypography(),
  ],
  transformers: [transformerVariantGroup()],
  safelist: [
    'text-3xl', 'md:text-5xl', 'tracking-widest',
    'px-4', 'py-2', 'hover:opacity-80'
  ],
    theme: {
    fontFamily: {
      english: 'Dosis, sans-serif',
      persian: 'Vazir, sans-serif',
    },
  },

})
