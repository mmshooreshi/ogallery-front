<!-- app/components/GalleryLightBox.vue -->
<script setup lang="ts">
const props = defineProps<{
  slides: { id: string; media: { url: string; alt?: string | null; caption?: string } }[]
  startIndex?: number
}>()


const emit = defineEmits(['close'])

const currentIndex = ref(props.startIndex ?? 0)

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.slides.length
}
function prev() {
  currentIndex.value =
    (currentIndex.value - 1 + props.slides.length) % props.slides.length
}
function goTo(i: number) {
  currentIndex.value = i
}

const zoomRef = ref()

</script>

<template>

  <div
    class="fixed inset-0  z-10  bg-black/00 flex flex-col items-center justify-center"
  >
    <!-- Close button -->

    <div class="GalleryBackdrop"></div>

     


    <!-- Big Image -->
    <div class="flex-1 flex flex-col gap-2 items-center justify-center w-full px-4 h-[500px]   mb-44 pt-24 fixed">

      <img
        :src="slides[currentIndex]?.media.url"
        :alt="slides[currentIndex]?.media.alt || ''" 
        class="h-full object-center object-contain max-w-[90vw] "
      />


    </div>

       <button
        @click="$emit('close')"
      class="absolute bg-black/0 mt-20  border-0 hover:bg-black/0 group cursor-pointer transition-all  right-4 top-0 text-black/50 hover:text-black text-4xl"
    >
        <div class="group-hover:scale-120  transition-all">
      ×
    </div>

      
    </button>
    <!-- Prev/Next arrows -->
    <button
      @click="prev"
      class="overflow-visible absolute bg-black/00  border-0 hover:bg-black/0 group cursor-pointer transition-all pt-0 pb-2  hover:pr-5 px-4 hover:left-0 left-1 top-1/2 -translate-y-1/2 text-black/50 hover:text-black text-4xl"
    >
    <!-- ➔ -->
    <div class="group-hover:scale-120 group-hover:-translate-x-1 transition-all z-10">
      <!-- <svg viewBox="0 0 28 23" xmlns="http://www.w3.org/2000/svg"><path d="M3.69542 10.7505L28 10.7505L28 12.2505L3.69631 12.2505L12.5549 21.9911L11.4451 23.0003L1.44515 12.0046L0.986226 11.5L1.44515 10.9954L11.4451 -0.000306623L12.5549 1.00892L3.69542 10.7505Z"></path></svg> -->
       ←
    </div>
    </button>
    <button
      @click="next"
      class="overflow-visible  absolute bg-black/00  border-0 hover:bg-black/0 group cursor-pointer transition-all pt-0 pb-2  hover:pl-5 px-4 hover:right-0 right-1 top-1/2 -translate-y-1/2 text-black/50 hover:text-black text-4xl"
    >
        <div class="group-hover:scale-120 group-hover:translate-x-1 transition-all">
      <!-- <svg viewBox="0 0 28 23" xmlns="http://www.w3.org/2000/svg"><path d="M3.69542 10.7505L28 10.7505L28 12.2505L3.69631 12.2505L12.5549 21.9911L11.4451 23.0003L1.44515 12.0046L0.986226 11.5L1.44515 10.9954L11.4451 -0.000306623L12.5549 1.00892L3.69542 10.7505Z"></path></svg> -->
       →
    </div>

      
    </button>



    <!-- Thumbnail strip -->
    <div class="flex flex-col max-w-screen bg-transparent w-full h-max  bg-black/10    z-10 w-max fixed bottom-0 ">
      

      <div class=" bg-white max-w-full text-black/60 pb-1 mx-4 md:mx-0 font-medium text-md overflow-auto  flex items-end  left-0" style="overflow-wrap: anywhere;"> 
        <!-- {{slides[currentIndex]}} -->
         {{slides[currentIndex]?.media?.caption}} 
    
    </div>

        <div class="flex gap-2 px-2 py-2 bg-black/10 md:max-w-[100vw] overflow-x-auto  z-10 bottom-0">

      <div
        v-for="(s, i) in slides"
        :key="s.id"
        class="cursor-pointer outline-solid outline-2  text-white h-[8vh]"
        :class="i === currentIndex ? 'outline-yellow-500' : 'outline-transparent'"
        @click="goTo(i)"
      >
      
        <NuxtImg
          :src="s.media.url"
          :alt="s.media.alt || ''"
          class="h-full w-max object-contain"
        />
      </div>
      </div>
    </div>
  </div>
</template>





<style scoped>
.GalleryBackdrop{
    position: fixed;
    inset: 0;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: white;
    /* background: rgba(255, 255, 255, 0.881); */
    /* backdrop-filter: blur(15px); */
    opacity: 1;
    will-change: opacity;

}
</style>

<!-- 
<div class="fancybox__container has-toolbar" role="dialog" aria-modal="true" aria-label="You can close this modal content with the ESC key" tabindex="-1" id="fancybox-1" aria-hidden="false"><div class="fancybox__toolbar is-absolute"><div class="fancybox__toolbar__column is-left"></div><div class="fancybox__toolbar__column is-middle"></div><div class="fancybox__toolbar__column is-right"><button class="f-button" title="Close" data-fancybox-close=""><svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m19.5 4.5-15 15M4.5 4.5l15 15"></path></svg></button></div></div>
    <div class="fancybox__backdrop"></div>
    <div class="fancybox__carousel is-ltr is-horizontal"><div class="fancybox__viewport is-draggable"><div class="fancybox__track" aria-live="polite" style="transform: matrix(1, 0, 0, 1, -1235, 0);"><div class="fancybox__slide has-image has-caption is-done" aria-labelledby="fancybox__caption_1_0" data-index="0" aria-hidden="true"><div class="fancybox__content" style="width: 584.622px; height: 694.797px; transform: matrix(1, 0, 0, 1, 0, 0);"><img src="//ogallery.net/files/Statics/uploads/2019/12/10.-Homa-Abdollahi-untitled-from-the-Static-series-mixed-media-on-aluminium-sheet-60x50-cm-2015.jpg" alt="Homa Abdollahi, Untitled from the Static series, mixed media on aluminium sheet, 60x50 cm, 2015" draggable="false" class="fancybox-image"></div><div class="fancybox__caption" id="fancybox__caption_1_0">Homa Abdollahi, Untitled from the Static series, mixed media on aluminium sheet, 60x50 cm, 2015</div></div><div class="fancybox__slide has-image has-caption is-selected is-done" aria-labelledby="fancybox__caption_1_1" data-index="1"><div class="fancybox__content" style="width: 575.689px; height: 694.797px; transform: matrix(1, 0, 0, 1, 0, 0);"><img src="//ogallery.net/files/Statics/uploads/2019/12/11.-Homa-Abdollahi-untitled-from-the-Static-series-mixed-media-on-aluminium-sheet-60x50-cm-2015.jpg" alt="Homa Abdollahi, Untitled from the Static series, mixed media on aluminium sheet, 60x50 cm, 2015" draggable="false" fetchpriority="high" class="fancybox-image"></div><div class="fancybox__caption" id="fancybox__caption_1_1">Homa Abdollahi, Untitled from the Static series, mixed media on aluminium sheet, 60x50 cm, 2015</div></div><div class="fancybox__slide has-image has-caption can-zoom_in is-done" aria-labelledby="fancybox__caption_1_2" data-index="2" aria-hidden="true"><div class="fancybox__content" style="width: 922.88px; height: 694.797px; transform: matrix(0.7585, 0, 0, 0.7585, 0, 0);"><img src="//ogallery.net/files/Statics/uploads/2019/12/6.-Homa-Abdollahi-untitled-from-the-Static-series-mixed-media-on-aluminium-sheet-19x25-cm-2015.jpg" alt="Homa Abdollahi, Untitled from the Static series, mixed media on aluminium sheet, 19x25 cm, 2015" draggable="false" class="fancybox-image"></div><div class="fancybox__caption" id="fancybox__caption_1_2">Homa Abdollahi, Untitled from the Static series, mixed media on aluminium sheet, 19x25 cm, 2015</div></div></div></div><div class="fancybox__nav"><button tabindex="0" title="Next" class="f-button is-next" data-carousel-next="true"><svg viewBox="0 0 28 23" xmlns="http://www.w3.org/2000/svg"><path d="M24.3046 12.2495H0V10.7495H24.3037L15.4451 1.00892L16.5549 -0.000305176L26.5549 10.9954L27.0138 11.5L26.5549 12.0046L16.5549 23.0003L15.4451 21.9911L24.3046 12.2495Z"></path></svg></button><button tabindex="0" title="Previous" class="f-button is-prev" data-carousel-prev="true"><svg viewBox="0 0 28 23" xmlns="http://www.w3.org/2000/svg"><path d="M3.69542 10.7505L28 10.7505L28 12.2505L3.69631 12.2505L12.5549 21.9911L11.4451 23.0003L1.44515 12.0046L0.986226 11.5L1.44515 10.9954L11.4451 -0.000306623L12.5549 1.00892L3.69542 10.7505Z"></path></svg></button></div></div>
    <div class="fancybox__footer"></div>
  </div> -->