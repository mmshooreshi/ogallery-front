// app/composables/useMultiLingual.ts

const localeFiles = import.meta.glob('../../i18n/locales/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, any>>

const FALLBACK_LOCALE = 'en'

// load all locale JSONs into a simple map: { en: {...}, fa: {...} }
const baseMessages: Record<string, Record<string, any>> = {}
for (const path in localeFiles) {
  const code = path.split('/').pop()!.replace('.json', '')
  baseMessages[code] = localeFiles[path] || {}
}

function getByPath(obj: any, path: string) {
  const parts = path.split('.')
  let current: any = obj
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined
    if (!(part in current)) return undefined
    current = current[part]
  }
  return current
}

export function useMultiLingual() {
  // your existing composable/plugin
  const { locale } = useI18n()

  // normalize whatever we get: "fa", "fa-IR", "FA" -> "fa", same for en
  const activeLocale = computed(() => {
    const raw = String(locale.value || '').toLowerCase()

    if (raw.startsWith('fa')) return 'fa'
    if (raw.startsWith('en')) return 'en'

    return FALLBACK_LOCALE
  })

  const messages = computed(() => {
    return baseMessages[activeLocale.value] || baseMessages[FALLBACK_LOCALE] || {}
  })

  function t(key: string, params?: Record<string, string | number>): string {
    const current = messages.value
    const fallback = baseMessages[FALLBACK_LOCALE] || {}

    let msg = getByPath(current, key) ?? getByPath(fallback, key) ?? key
    if (typeof msg !== 'string') msg = key

    if (params) {
      msg = msg.replace(/\{(\w+)\}/g, (_: string, p: string) =>
        String(params[p] ?? ''),
      )
    }

    return msg
  }

  return {
    messages,
    t,
  }
}
