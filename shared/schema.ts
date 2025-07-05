import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  folderPath: text("folder_path").notNull().unique(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  allowDownload: boolean("allow_download").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id").notNull().references(() => galleries.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const galleriesRelations = relations(galleries, ({ many }) => ({
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  gallery: one(galleries, {
    fields: [photos.galleryId],
    references: [galleries.id],
  }),
}));

export const insertGallerySchema = createInsertSchema(galleries).omit({
  id: true,
  createdAt: true,
});

export const updateGallerySchema = createInsertSchema(galleries).omit({
  id: true,
  createdAt: true,
}).partial();

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const emailShareSchema = z.object({
  galleryId: z.number(),
  recipient: z.string().email(),
  subject: z.string().min(1),
  message: z.string().optional(),
  includeDownload: z.boolean().default(false),
});

export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type UpdateGallery = z.infer<typeof updateGallerySchema>;
export type Gallery = typeof galleries.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type EmailShare = z.infer<typeof emailShareSchema>;
