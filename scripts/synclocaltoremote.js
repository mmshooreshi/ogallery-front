import "dotenv/config"
import { PrismaClient } from "@prisma/client"

if (!process.env.DATABASE_URL_LOCAL || !process.env.DATABASE_URL_REMOTE) {
  console.error("DATABASE_URL_LOCAL or DATABASE_URL_REMOTE is missing in .env")
  process.exit(1)
}

const local = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_LOCAL } }
})

const remote = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_REMOTE } }
})

async function truncateRemote() {
  console.log("🧨 Clearing remote DB…")

  await remote.$executeRawUnsafe(`TRUNCATE TABLE 
    "Link",
    "EntryMedia",
    "EntryTag",
    "UrlAlias",
    "EntryLocale",
    "Entry",
    "Tag",
    "Media",
    "User"
    RESTART IDENTITY CASCADE;
  `)

  console.log("✔ Remote cleaned.")
}

async function main() {
  console.log("⚡ Super-sync starting…")

//   await truncateRemote()

  //
  // USERS
  //
  console.log("→ Users")
  const users = await local.user.findMany()
  await remote.user.createMany({ data: users })
  const remoteUsers = await remote.user.findMany()
  const userMap = new Map(users.map((u, i) => [u.id, remoteUsers[i].id]))

  //
  // MEDIA
  //
  console.log("→ Media")
  const media = await local.media.findMany()
  const mediaToInsert = media.map(m => ({
    ...m,
    createdById: m.createdById ? userMap.get(m.createdById) : null
  }))
  await remote.media.createMany({ data: mediaToInsert })
  const remoteMedia = await remote.media.findMany()
  const mediaMap = new Map(media.map((m, i) => [m.id, remoteMedia[i].id]))

  //
  // TAGS
  //
  console.log("→ Tags")
  const tags = await local.tag.findMany()
  await remote.tag.createMany({ data: tags })
  const remoteTags = await remote.tag.findMany()
  const tagMap = new Map(tags.map((t, i) => [t.id, remoteTags[i].id]))

  //
  // ENTRIES
  //
  console.log("→ Entries")
  const entries = await local.entry.findMany()
  const entriesToInsert = entries.map(e => ({
    ...e,
    coverMediaId: e.coverMediaId ? mediaMap.get(e.coverMediaId) : null
  }))
  await remote.entry.createMany({ data: entriesToInsert })
  const remoteEntries = await remote.entry.findMany()
  const entryMap = new Map(entries.map((e, i) => [e.id, remoteEntries[i].id]))

  //
  // ENTRY LOCALES
  //
  console.log("→ EntryLocale")
  const entryLocales = await local.entryLocale.findMany()
  const entryLocalesToInsert = entryLocales.map(l => ({
    ...l,
    entryId: entryMap.get(l.entryId)
  }))
  await remote.entryLocale.createMany({ data: entryLocalesToInsert })

  //
  // URL ALIASES
  //
  console.log("→ UrlAlias")
  const urlAliases = await local.urlAlias.findMany()
  await remote.urlAlias.createMany({ data: urlAliases })

  //
  // ENTRY TAGS
  //
  console.log("→ EntryTag")
  const entryTags = await local.entryTag.findMany()
  const entryTagsToInsert = entryTags.map(e => ({
    entryId: entryMap.get(e.entryId),
    tagId: tagMap.get(e.tagId)
  }))
  await remote.entryTag.createMany({ data: entryTagsToInsert })

  //
  // ENTRY MEDIA
  //
  console.log("→ EntryMedia")
  const entryMedia = await local.entryMedia.findMany()
  const entryMediaToInsert = entryMedia.map(m => ({
    entryId: entryMap.get(m.entryId),
    mediaId: mediaMap.get(m.mediaId),
    role: m.role,
    ord: m.ord,
    meta: m.meta
  }))
  await remote.entryMedia.createMany({ data: entryMediaToInsert })

  //
  // LINKS
  //
  console.log("→ Links")
  const links = await local.link.findMany()
  const linksToInsert = links.map(l => ({
    fromId: entryMap.get(l.fromId),
    toId: entryMap.get(l.toId),
    role: l.role,
    ord: l.ord
  }))
  await remote.link.createMany({ data: linksToInsert })

  console.log("🎉 FAST SYNC COMPLETE.")
}

main()
  .catch(err => console.error(err))
  .finally(async () => {
    await local.$disconnect()
    await remote.$disconnect()
  })
