// app/composables/useEntry.ts
import { computed } from 'vue'
import type { EntryCard, EntryDetail } from '~~/server/queries/common'
import { useLocalCache } from '~/composables/useLocalCache'

// Helper to Group Media (Main Works vs Details)
function groupMediaItems(entry: any) {
  if (!entry?.media || !Array.isArray(entry.media)) return entry

  // 1. Separators
  const mainWorks: any[] = []
  const details: any[] = []

  // 2. Classify
  entry.media.forEach((item: any) => {
    // Adjust 'role' checks based on your exact API values
    if (item.role === 'SELECTED_WORK' || item.role === 'WORK') {
      // Initialize a bucket for details
      item.otherMedia = [item] // Start with itself as the first slide
      mainWorks.push(item)
    } else {
      details.push(item)
    }
  })

  // 3. Nest Details into Parents
  // Assumption: Details have a 'parent_id' or 'media_group_id' matching the Main Work's 'id'.
  // If your API doesn't have parent_id, it relies on strict ordering (unreliable) 
  // or you might need to adjust this matching logic.
  details.forEach((detail) => {
    const parent = mainWorks.find(p => p.id === detail.parent_id || p.id === detail.related_id)
    if (parent) {
      parent.otherMedia.push(detail)
    }
  })

  // 4. Override the flat entry.media with the nested mainWorks only
  // This ensures the generic v-for in the UI only loops over artworks, not details.
  entry.media = mainWorks
  
  return entry
}

export function useEntryList(kind: string) {
  const { locale } = useI18n()
  const route = useRoute()
  
  const year = computed(() => Number(route.query.year) || undefined)
  // Include year in key to cache different filter states separately
  const key = computed(() => `${kind}:list:${locale.value}:${year.value ?? 'all'}`)

  return useLocalCache<EntryCard[]>(
    () => key.value,
    () => {
      const query = {
        locale: locale.value,
        ...(year.value && { year: year.value })
      };
      return $fetch(`/_q/${kind}`, { query });
    },
    { 
      ttlMs: 60_000, 
      swr: true, 
      initial: [] 
    }
  )
}

export function useEntryDetail(kind: string) {
  const { locale } = useI18n()
  const route = useRoute()
  const slug = computed(() => String(route.params.slug))

  const key = computed(() => `${kind}:detail:${locale.value}:${slug.value}`)

  return useLocalCache<EntryDetail | null>(
    () => key.value,
    async () => {
      // 1. Fetch raw data
      const data = await $fetch<EntryDetail>(`/_q/${kind}/${slug.value}`, { 
        query: { locale: locale.value } 
      })

      // 2. Transform/Group Media if it's a viewing room or studio entry
      // This prevents "extra images" from polluting the main grid
      if (data && (kind === 'viewing-rooms' || kind === 'studio')) {
        return groupMediaItems(data)
      }

      return data
    },
    { 
      ttlMs: 60_000, 
      swr: true, 
      initial: null 
    }
  )
}