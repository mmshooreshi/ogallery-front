import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

await setup({
  server: true, // spin up Nitro
  browser: false
})

describe('artists route', () => {
  it('renders the artists index', async () => {
    const html = await $fetch('/artists')
    expect(html).toContain('Artists')
  })

  it('returns sitemap artists', async () => {
    const data = await $fetch('/api/sitemap/artists')
    expect(Array.isArray(data)).toBe(true)
  })
})
