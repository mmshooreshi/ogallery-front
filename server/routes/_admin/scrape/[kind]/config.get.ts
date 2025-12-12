// server/routes/_admin/scrape/[kind]/config.get.ts
import { Configs } from '~~/server/lib/ogallery/configs';

// GET /_admin/scrape/exhibitions/config
export default defineEventHandler(async (event) => {
  const kindParam = getRouterParam(event, 'kind') as keyof typeof Configs;
  const Config = Configs[kindParam];
    console.log(kindParam)    
  return {
    paths: {
      list: Config.paths.list,
    },
  }
})
