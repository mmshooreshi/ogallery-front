<script setup lang="ts">
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

interface SlideData {
  media: {
    url: string;
    alt?: string | null;
    caption?: string | null;
  };
}

const props = defineProps<{
  slides: SlideData[];
  startIndex?: number;
}>();

const emit = defineEmits(['close']);

let lightbox: PhotoSwipeLightbox | null = null;

onMounted(() => {
  if (!props.slides || props.slides.length === 0) {
    emit('close');
    return;
  }

  // 1. Prepare Data
  // We explicitly map 'msrc' (thumbnail source) to the same URL 
  // to ensure the transition looks seamless immediately.
  const dataSource = props.slides.map((slide) => ({
    src: slide.media.url,
    msrc: slide.media.url, // Vital for the opening zoom transition
    alt: slide.media.alt || '',
    title: slide.media.caption || '',
    w: 0,
    h: 0,
    loaded: false,
  }));

  // 2. Initialize PhotoSwipe
  lightbox = new PhotoSwipeLightbox({
    dataSource: dataSource,
    
    // --- ANIMATION SETTINGS ---
    showHideAnimationType: 'zoom', // Force the zoom transition
    showAnimationDuration: 400,    // Smooth 400ms opening
    hideAnimationDuration: 400,    // Smooth 400ms closing
    
    // --- ZOOM & GESTURES ---
    maxZoomLevel: 4,
    secondaryZoomLevel: 2,
    
    // --- SPACING ---
    padding: { top: 40, bottom: 80, left: 20, right: 20 },

    // --- BACKGROUND ---
    bgOpacity: 0.95, // Dark background
    
    // --- THE MAGIC: Link to DOM Thumbnails ---
    // This function tells PhotoSwipe where the original image is 
    // so it can "zoom out" from it.
    getThumbBoundsFn: (index: number) => {
        // Find the image in the parent grid using the ID we added
        const thumbnail = document.getElementById('pswp-thumb-' + index);
        
        if (thumbnail) {
            const pageYScroll = window.scrollY || document.documentElement.scrollTop;
            const rect = thumbnail.getBoundingClientRect();
            return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
        }
        return null;
    },

    pswpModule: () => import('photoswipe'),
  });

  // 3. Handle Auto-Sizing
  lightbox.on('gettingData', (event: any) => {
    const item = event.data;
    if (!item.loaded) {
      const img = new Image();
      img.src = item.src;
      img.onload = () => {
        item.w = img.naturalWidth;
        item.h = img.naturalHeight;
        item.loaded = true;
        if (lightbox?.pswp) {
          lightbox.pswp.refreshSlideContent(event.index);
        }
      };
    }
  });

  // 4. Custom Caption (Bottom, no frame)
  lightbox.on('uiRegister', () => {
    lightbox?.pswp?.ui?.registerElement({
      name: 'custom-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: (el, pswp) => {
        lightbox?.pswp?.on('change', () => {
          const currSlideElement = pswp.currSlide?.data;
          let captionHTML = '';
          if (currSlideElement && currSlideElement.title) {
            captionHTML = currSlideElement.title;
          }
          el.innerHTML = captionHTML;
          el.classList.add('pswp-custom-caption');
        });
      }
    });
  });

  lightbox.on('destroy', () => emit('close'));
  lightbox.init();
  
  // Open specifically with the zoom transition
  lightbox.loadAndOpen(props.startIndex || 0);
});

onUnmounted(() => {
  if (lightbox) {
    lightbox.destroy();
    lightbox = null;
  }
});
</script>

<template>
  <div style="display: none;"></div>
</template>

<style>
/* --- ICONS (Clean White) --- */
.pswp {
  --pswp-icon-color: #ffffff;
  --pswp-icon-color-secondary: #ffffff;
}
.pswp__icn-shadow {
  display: none;
}
.pswp__icn {
  opacity: 0.8;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); /* Optional: tiny shadow for visibility against white images */
}

/* --- CAPTION --- */
.pswp-custom-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-height: 80px;
  padding: 20px;
  color: #ffffff; 
  font-size: 14px;
  font-weight: 400;
  text-align: center;
  line-height: 1.5;
  background: transparent;
  pointer-events: none;
}
</style>