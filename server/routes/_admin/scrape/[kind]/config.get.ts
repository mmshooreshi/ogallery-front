import { Configs } from '~~/server/lib/ogallery/configs';

// GET /_admin/scrape/exhibitions/config
export default defineEventHandler(async (event) => {
  const kindParam = getRouterParam(event, 'kind') as keyof typeof Configs;
  const ExhibitionConfig = Configs[kindParam];
    
  return {
    paths: {
      list: ExhibitionConfig.paths.list,
    },
  }
})
