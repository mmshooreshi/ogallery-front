// app/composables/useLocalCache.ts
import { ref, watch, onMounted, watchEffect } from 'vue'

type Options<T> = { ttlMs?: number; swr?: boolean; initial?: T }
type CacheEnvelope<T> = { t: number; v: T }

export function useLocalCache<T>(
  keyFn: () => string,
  fetcher: () => Promise<T>,
  opts: Options<T> = {}
) {
  const ttl = opts.ttlMs ?? 60_000
  const swr = opts.swr ?? true

  const keyRef = ref('')
  watchEffect(() => { keyRef.value = keyFn() })

  const data = ref<T | undefined>(opts.initial)
  const pending = ref(false)
  const error = ref<unknown>(null)
  function read() {
    console.log('[useLocalCache] read called for key', keyRef.value)
    try {
      const raw = localStorage.getItem(keyRef.value)
      if (!raw) {
        console.log('[useLocalCache] no cache found')
        return
      }
      const { t, v } = JSON.parse(raw) as CacheEnvelope<T>
      console.log('[useLocalCache] cache hit', { age: Date.now() - t, value: v })
      data.value = v
      return Date.now() - t
    } catch (err) {
      console.error('[useLocalCache] error reading cache', err)
    }
  }

  function write(v: T) {
    console.log('[useLocalCache] write called for key', keyRef.value, v)
    try {
      localStorage.setItem(keyRef.value, JSON.stringify({ t: Date.now(), v }))
    } catch (err) {
      console.error('[useLocalCache] error writing cache', err)
    }
  }

  async function refresh() {
    pending.value = true
    error.value = null
    try {
      const v = await fetcher()
      data.value = v
      write(v)
    } catch (e) {
      error.value = e
    } finally {
      pending.value = false
    }
  }
  
  // read()
  onMounted(() => {
    const age = read()
    console.log("need to refresh?","age:",age,"ttl:",ttl," --> ",!age || age > ttl ? "yes" : "no")
    if (!age || age > ttl) refresh()
    else if (swr) refresh()
  })

  watch(keyRef, () => { if (import.meta.client) { read(); refresh() } })

  return { data, pending, error, refresh }
}
