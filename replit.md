# Gallery Management App

## Overview
A professional gallery management application with folder-based organization, admin controls, and email sharing functionality. Features a comprehensive photo management system with bulk operations, metadata display, and database persistence.

## Architecture
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js server with RESTful API
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Storage**: Database-backed storage replacing in-memory storage (migrated December 2024)
- **File Handling**: Multer for photo uploads with local file storage

## Key Features
- Gallery creation and management with folder paths
- Photo upload with drag-and-drop interface
- Bulk photo operations (select, delete multiple photos)
- Photo metadata display (file size, type, upload date)
- Gallery editing capabilities
- Email sharing with custom messages
- Admin panel for comprehensive management
- Responsive design with mobile support

## Recent Changes
**December 2024:**
- ✅ Migrated from in-memory storage to PostgreSQL database
- ✅ Added Drizzle ORM with proper schema and relations
- ✅ Implemented DatabaseStorage class replacing MemStorage
- ✅ Created database tables and seeded with sample data
- ✅ Enhanced bulk photo selection and operations
- ✅ Added photo information modal with metadata
- ✅ Implemented gallery editing functionality
- ✅ Fixed type compatibility issues

## Database Schema
- **galleries**: id, name, folderPath, description, isPublic, allowDownload, createdAt
- **photos**: id, galleryId, filename, originalName, path, size, mimeType, createdAt
- **Relations**: One gallery has many photos

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS: Email configuration

## API Endpoints
- GET /api/galleries - List all galleries
- POST /api/galleries - Create new gallery
- PATCH /api/galleries/:id - Update gallery
- DELETE /api/galleries/:id - Delete gallery
- GET/POST /api/galleries/:id/photos - Photo operations
- POST /api/share - Email sharing

## User Preferences
- Folder-based gallery organization preferred
- Professional-grade features prioritized
- Database persistence over in-memory storage
- Comprehensive admin functionality required