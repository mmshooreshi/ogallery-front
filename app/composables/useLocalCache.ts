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
    try {
      const raw = localStorage.getItem(keyRef.value)
      if (!raw) return
      const { t, v } = JSON.parse(raw) as CacheEnvelope<T>
      data.value = v
      return Date.now() - t
    } catch {}
  }
  function write(v: T) {
    try { localStorage.setItem(keyRef.value, JSON.stringify({ t: Date.now(), v })) } catch {}
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

  onMounted(() => {
    const age = read()
    if (!age || age > ttl) refresh()
    else if (swr) refresh()
  })

  watch(keyRef, () => { if (process.client) { read(); refresh() } })

  return { data, pending, error, refresh }
}
