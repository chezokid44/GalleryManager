import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { insertGallerySchema, insertPhotoSchema, emailShareSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || "demo@example.com",
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || "demo_password",
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  // Gallery routes
  app.get("/api/galleries", async (req, res) => {
    try {
      const galleries = await storage.getGalleries();
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch galleries" });
    }
  });

  app.get("/api/galleries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gallery = await storage.getGallery(id);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      res.json(gallery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  app.post("/api/galleries", async (req, res) => {
    try {
      const validatedData = insertGallerySchema.parse(req.body);
      
      // Create folder if it doesn't exist
      const fullPath = path.join(process.cwd(), "uploads", validatedData.folderPath);
      await fs.mkdir(fullPath, { recursive: true });
      
      const gallery = await storage.createGallery(validatedData);
      res.status(201).json(gallery);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create gallery" });
      }
    }
  });

  app.delete("/api/galleries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gallery = await storage.getGallery(id);
      
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      // Delete physical folder and files
      const fullPath = path.join(process.cwd(), "uploads", gallery.folderPath);
      try {
        await fs.rm(fullPath, { recursive: true, force: true });
      } catch (fsError) {
        console.warn("Failed to delete physical folder:", fsError);
      }

      const deleted = await storage.deleteGallery(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Gallery not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete gallery" });
    }
  });

  // Photo routes
  app.get("/api/galleries/:galleryId/photos", async (req, res) => {
    try {
      const galleryId = parseInt(req.params.galleryId);
      const photos = await storage.getPhotosByGallery(galleryId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.post("/api/galleries/:galleryId/photos", upload.array("photos", 50), async (req, res) => {
    try {
      const galleryId = parseInt(req.params.galleryId);
      const gallery = await storage.getGallery(galleryId);
      
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedPhotos = [];
      
      for (const file of files) {
        // Move file to gallery folder
        const galleryPath = path.join(process.cwd(), "uploads", gallery.folderPath);
        await fs.mkdir(galleryPath, { recursive: true });
        
        const filename = `${Date.now()}-${file.originalname}`;
        const newPath = path.join(galleryPath, filename);
        await fs.rename(file.path, newPath);

        const photoData = {
          galleryId,
          filename,
          originalName: file.originalname,
          path: path.join(gallery.folderPath, filename),
          size: file.size,
          mimeType: file.mimetype,
        };

        const photo = await storage.createPhoto(photoData);
        uploadedPhotos.push(photo);
      }

      res.status(201).json(uploadedPhotos);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photo = await storage.getPhoto(id);
      
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      // Delete physical file
      const fullPath = path.join(process.cwd(), "uploads", photo.path);
      try {
        await fs.unlink(fullPath);
      } catch (fsError) {
        console.warn("Failed to delete physical file:", fsError);
      }

      const deleted = await storage.deletePhoto(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Photo not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Email sharing route
  app.post("/api/share", async (req, res) => {
    try {
      const validatedData = emailShareSchema.parse(req.body);
      const gallery = await storage.getGallery(validatedData.galleryId);
      
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      const galleryUrl = `${req.protocol}://${req.get('host')}/gallery/${gallery.id}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">You've received a photo gallery!</h2>
          <p>Someone has shared a photo gallery with you: <strong>${gallery.name}</strong></p>
          ${validatedData.message ? `<p style="font-style: italic;">"${validatedData.message}"</p>` : ''}
          <p style="margin: 30px 0;">
            <a href="${galleryUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Gallery
            </a>
          </p>
          ${validatedData.includeDownload ? '<p><small>Download access has been enabled for this gallery.</small></p>' : ''}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">This gallery contains ${gallery.description || 'beautiful photos'}.</p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_USER || "noreply@gallerypro.com",
        to: validatedData.recipient,
        subject: validatedData.subject,
        html: emailHtml,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Email error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
