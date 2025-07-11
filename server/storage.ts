import { galleries, photos, type Gallery, type Photo, type InsertGallery, type InsertPhoto, type UpdateGallery } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Gallery operations
  createGallery(gallery: InsertGallery): Promise<Gallery>;
  getGalleries(): Promise<Gallery[]>;
  getGallery(id: number): Promise<Gallery | undefined>;
  updateGallery(id: number, updates: UpdateGallery): Promise<Gallery | undefined>;
  deleteGallery(id: number): Promise<boolean>;
  
  // Photo operations
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getPhotosByGallery(galleryId: number): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private galleries: Map<number, Gallery>;
  private photos: Map<number, Photo>;
  private currentGalleryId: number;
  private currentPhotoId: number;

  constructor() {
    this.galleries = new Map();
    this.photos = new Map();
    this.currentGalleryId = 1;
    this.currentPhotoId = 1;
    
    // Initialize with sample data
    this.seedData();
  }

  private seedData() {
    // Create sample galleries
    const weddingGallery: Gallery = {
      id: this.currentGalleryId++,
      name: "Wedding Photos",
      folderPath: "/photos/wedding-2024",
      description: "Beautiful moments from Sarah & John's wedding day",
      isPublic: true,
      allowDownload: true,
      createdAt: new Date("2024-03-15"),
    };
    this.galleries.set(weddingGallery.id, weddingGallery);

    const vacationGallery: Gallery = {
      id: this.currentGalleryId++,
      name: "Vacation Photos",
      folderPath: "/photos/vacation-2024",
      description: "Summer vacation memories",
      isPublic: false,
      allowDownload: true,
      createdAt: new Date("2024-02-10"),
    };
    this.galleries.set(vacationGallery.id, vacationGallery);

    const familyGallery: Gallery = {
      id: this.currentGalleryId++,
      name: "Family Portraits",
      folderPath: "/photos/family-2024",
      description: "Annual family portrait session",
      isPublic: false,
      allowDownload: true,
      createdAt: new Date("2024-01-22"),
    };
    this.galleries.set(familyGallery.id, familyGallery);
  }

  async createGallery(insertGallery: InsertGallery): Promise<Gallery> {
    const gallery: Gallery = {
      id: this.currentGalleryId++,
      name: insertGallery.name,
      folderPath: insertGallery.folderPath,
      description: insertGallery.description || null,
      isPublic: insertGallery.isPublic ?? false,
      allowDownload: insertGallery.allowDownload ?? true,
      createdAt: new Date(),
    };
    this.galleries.set(gallery.id, gallery);
    return gallery;
  }

  async getGalleries(): Promise<Gallery[]> {
    return Array.from(this.galleries.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    return this.galleries.get(id);
  }

  async updateGallery(id: number, updates: UpdateGallery): Promise<Gallery | undefined> {
    const existing = this.galleries.get(id);
    if (!existing) return undefined;

    const updated: Gallery = {
      ...existing,
      ...updates,
    };
    
    this.galleries.set(id, updated);
    return updated;
  }

  async deleteGallery(id: number): Promise<boolean> {
    // Delete all photos in gallery first
    const photosToDelete = Array.from(this.photos.values()).filter(p => p.galleryId === id);
    photosToDelete.forEach(photo => this.photos.delete(photo.id));
    
    return this.galleries.delete(id);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const photo: Photo = {
      id: this.currentPhotoId++,
      galleryId: insertPhoto.galleryId,
      filename: insertPhoto.filename,
      originalName: insertPhoto.originalName,
      path: insertPhoto.path,
      size: insertPhoto.size,
      mimeType: insertPhoto.mimeType,
      createdAt: new Date(),
    };
    this.photos.set(photo.id, photo);
    return photo;
  }

  async getPhotosByGallery(galleryId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.galleryId === galleryId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getGalleries(): Promise<Gallery[]> {
    return await db.select().from(galleries).orderBy(galleries.createdAt);
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    const [gallery] = await db.select().from(galleries).where(eq(galleries.id, id));
    return gallery || undefined;
  }

  async createGallery(insertGallery: InsertGallery): Promise<Gallery> {
    const [gallery] = await db
      .insert(galleries)
      .values(insertGallery)
      .returning();
    return gallery;
  }

  async updateGallery(id: number, updates: UpdateGallery): Promise<Gallery | undefined> {
    const [gallery] = await db
      .update(galleries)
      .set(updates)
      .where(eq(galleries.id, id))
      .returning();
    return gallery || undefined;
  }

  async deleteGallery(id: number): Promise<boolean> {
    // Delete all photos in gallery first
    await db.delete(photos).where(eq(photos.galleryId, id));
    
    const result = await db.delete(galleries).where(eq(galleries.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPhotosByGallery(galleryId: number): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.galleryId, galleryId))
      .orderBy(photos.createdAt);
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo || undefined;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db
      .insert(photos)
      .values(insertPhoto)
      .returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
