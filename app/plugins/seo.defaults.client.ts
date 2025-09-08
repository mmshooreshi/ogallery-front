// app/plugins/seo.defaults.client.ts (or server & client)
import { useSchemaOrg } from '#imports'

export default defineNuxtPlugin(() => {
  useSeoMeta({
    // title: 'Home',
    ogSiteName: 'O Gallery',
    themeColor: '#ffffff',
    twitterCard: 'summary_large_image',
  })

  // Example schema.org on the home page:
  if (import.meta.client) {
    useSchemaOrg([
      defineWebSite({ name: 'O Gallery', url: 'https://ogallery.net' }),
      defineOrganization({ name: 'O Gallery' }),
    ])
  }
})
