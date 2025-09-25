// server/plugins/prisma-close.ts
import { prisma } from '../lib/prisma'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await prisma.$disconnect()
  })
})
