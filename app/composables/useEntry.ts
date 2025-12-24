import { computed } from 'vue'
import type { EntryCard, EntryDetail } from '~~/server/queries/common'
import { useLocalCache } from '~/composables/useLocalCache'

export function useEntryList(kind: string) {
  const { locale } = useI18n()
  const route = useRoute()
  
  // Optional: Read year from query if you want filtering
  const year = computed(() => Number(route.query.year) || undefined)

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
    () => $fetch(`/_q/${kind}/${slug.value}`, { 
      query: { locale: locale.value } 
    }),
    { 
      ttlMs: 60_000, 
      swr: true, 
      initial: null 
    }
  )
}