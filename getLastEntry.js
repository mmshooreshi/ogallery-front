import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Recursive printer for any object or array
function printRecursive(obj, indent = 0) {
  const spacing = '  '.repeat(indent);
  if (Array.isArray(obj)) {
    console.log(spacing + '[');
    obj.forEach(item => printRecursive(item, indent + 1));
    console.log(spacing + ']');
  } else if (obj && typeof obj === 'object') {
    console.log(spacing + '{');
    for (const key in obj) {
      process.stdout.write(spacing + '  ' + key + ': ');
      printRecursive(obj[key], indent + 1);
    }
    console.log(spacing + '}');
  } else {
    console.log(spacing + obj);
  }
}

async function getLastArtists(count = 5) {
  try {
    // Fetch last `count` artist entries with related locales and media
    const artists = await prisma.entry.findMany({
      where: { kind: 'ARTIST' },
      orderBy: { createdAt: 'desc' },
      take: count,
      include: {
        locales: true, // related EntryLocales
        media: true,   // related media
      },
    });

    if (!artists || artists.length === 0) {
      console.log("No artist entries found.");
      return;
    }

    artists.forEach((artist, index) => {
      console.log(`\n=== Artist Entry #${index + 1} ===`);
      printRecursive(artist);

      // Access props.works if exists
      if (artist.props?.works) {
        console.log("Works array:");
        printRecursive(artist.props.works);
      }

      // Show related locales
      if (artist.locales && artist.locales.length > 0) {
        console.log("Related EntryLocales:");
        printRecursive(artist.locales);
      }

      // Show related media
      if (artist.media && artist.media.length > 0) {
        console.log("Related Media:");
        printRecursive(artist.media);
      }
    });

  } catch (error) {
    console.error("Error fetching artist entries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getLastArtists(5);
