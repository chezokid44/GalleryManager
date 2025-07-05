import { db } from "./db";
import { galleries, photos } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  // Create sample galleries
  const sampleGalleries = await db
    .insert(galleries)
    .values([
      {
        name: "Wedding Photos",
        folderPath: "/photos/wedding-2024",
        description: "Beautiful moments from Sarah & John's wedding day",
        isPublic: true,
        allowDownload: true,
      },
      {
        name: "Vacation Photos",
        folderPath: "/photos/vacation-2024",
        description: "Summer vacation memories",
        isPublic: false,
        allowDownload: true,
      },
      {
        name: "Family Portraits",
        folderPath: "/photos/family-2024",
        description: "Annual family portrait session",
        isPublic: false,
        allowDownload: true,
      },
    ])
    .returning();

  console.log(`Created ${sampleGalleries.length} sample galleries`);
  console.log("Database seeded successfully!");
}

seedDatabase().catch(console.error);