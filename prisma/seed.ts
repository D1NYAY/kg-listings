import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Цветы", slug: "flowers" },
  { name: "Подарки", slug: "gifts" },
  { name: "Одежда", slug: "clothing" },
  { name: "Обувь", slug: "shoes" },
  { name: "Электроника", slug: "electronics" },
  { name: "Аксессуары", slug: "accessories" },
  { name: "Другое", slug: "other" },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }

  // Миграция: копируем photoFileId старых объявлений в ListingImage
  const listingsWithPhoto = await prisma.listing.findMany({
    where: { photoFileId: { not: null } },
    include: { images: { orderBy: { order: "asc" } } },
  });
  for (const listing of listingsWithPhoto) {
    if (listing.images.length === 0 && listing.photoFileId) {
      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          fileId: listing.photoFileId,
          order: 0,
        },
      });
      console.log(`Migrated photo for listing ${listing.id}`);
    }
  }
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
