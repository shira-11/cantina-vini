import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting photo synchronization across vintages...");
  
  // Get all wines that have a photo
  const winesWithPhotos = await prisma.wine.findMany({
    where: {
      photo: {
        not: null,
      },
    },
    select: {
      name: true,
      photo: true,
    }
  });
  
  // Group photos by wine name (take the first one we find)
  const photoMap = {};
  for (const w of winesWithPhotos) {
    if (w.photo && w.photo.trim() !== '') {
      if (!photoMap[w.name]) {
        photoMap[w.name] = w.photo;
      }
    }
  }
  
  // Find all wines that are missing a photo
  const winesWithoutPhotos = await prisma.wine.findMany({
    where: {
      OR: [
        { photo: null },
        { photo: '' }
      ]
    }
  });
  
  let updatedCount = 0;
  
  for (const w of winesWithoutPhotos) {
    // If we have a photo for this wine name
    if (photoMap[w.name]) {
      await prisma.wine.update({
        where: { id: w.id },
        data: { photo: photoMap[w.name] }
      });
      console.log(`Updated [${w.name} ${w.vintage}] with photo: ${photoMap[w.name]}`);
      updatedCount++;
    }
  }
  
  console.log(`Synchronization complete! Updated ${updatedCount} wines with missing photos.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
