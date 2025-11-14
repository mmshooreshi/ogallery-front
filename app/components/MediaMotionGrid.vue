<!-- app/components/MediaMotionGrid.vue -->
<script setup lang="tsx">
/** @jsxImportSource vue */
import { motion } from "motion-v"
import { CSSProperties, defineComponent } from "vue"

const props = defineProps<{
  dirs: any[]
  files: any[]
  isImage: (f: any) => boolean
  thumb: (f: any) => string
}>()

/**
 * Animated Card (file or folder)
 */
const MediaCard = defineComponent({
  props: {
    item: { type: Object, required: true },
    i: { type: Number, required: true },
    isImage: { type: Function, required: true },
    thumb: { type: Function, required: true },
  },
  setup(props) {
    const isFile = props.item.type === "file"

    return () => (
      <motion.div
        class="rounded-xl bg-white p-3 shadow-sm border border-transparent hover:border-blue-300 hover:shadow-md transition-all"
        style={cardContainer}
        initial="offscreen"
        whileInView="onscreen"
        inViewOptions={{ amount: 0.5 }}
      >
        <motion.div style={card} variants={cardVariants}>
          {isFile ? (
            props.isImage(props.item) ? (
              <img
                src={props.item.preview || props.thumb(props.item)}
                class="object-cover w-full h-full rounded-lg"
              />
            ) : (
              <div class="text-4xl">📄</div>
            )
          ) : (
            <div class="text-4xl">📁</div>
          )}
        </motion.div>
        <div class="mt-2 text-sm font-medium truncate">
          {props.item.name}
        </div>
      </motion.div>
    )
  },
})

/**
 * Animations
 */
const cardVariants = {
  offscreen: {
    y: 40,
    opacity: 0,
    scale: 0.9,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.35,
      duration: 0.6,
    },
  },
}

/**
 * Card container styles
 */
const cardContainer: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}

const card: CSSProperties = {
  width: "100%",
  height: "140px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "16px",
  background: "#f9fafb",
  overflow: "hidden",
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
    <!-- Folders -->
    <MediaCard
      v-for="(d, i) in dirs"
      :key="d.uid"
      :item="{ ...d, type: 'dir' }"
      :i="i"
      :isImage="isImage"
      :thumb="thumb"
    />

    <!-- Files -->
    <MediaCard
      v-for="(f, i) in files"
      :key="f.uid"
      :item="{ ...f, type: 'file' }"
      :i="i"
      :isImage="isImage"
      :thumb="thumb"
    />
  </div>
</template>
