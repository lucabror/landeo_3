# Replit.md - Hotel Itinerary Management System

## Overview

This is a comprehensive full-stack TypeScript application for Italian hotel itinerary management built with React, Express, and PostgreSQL. The system allows hotels to manage guest profiles, local experiences, and generate personalized AI-powered itineraries. Key features include manager editing of individual itinerary blocks, QR code PDF generation for guest access, and email PDF functionality for direct guest communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React SPA with Vite build system
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types using Zod validation
- **Styling**: TailwindCSS with shadcn/ui component library

### Architecture Rationale

The monorepo approach was chosen to maintain type safety between frontend and backend while sharing schemas and types. This reduces duplication and ensures consistency across the full stack.

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **shadcn/ui** components built on Radix UI primitives
- **TailwindCSS** for styling with CSS custom properties for theming

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations with type-safe queries
- **Neon Database** as PostgreSQL provider
- **Zod** for request validation using shared schemas
- **OpenAI integration** for AI-powered itinerary generation
- **QR code generation** using the qrcode library
- **PDF generation** using PDFKit

### Database Schema
The application uses four main entities:
- **Hotels**: Store hotel information and branding
- **Guest Profiles**: Manage guest preferences and stay details
- **Local Experiences**: Catalog of activities and attractions
- **Itineraries**: Generated travel plans with unique URLs

## Data Flow

1. **Hotel Setup**: Hotels configure their profile and branding
2. **Experience Management**: Hotels add local attractions and activities
3. **Guest Registration**: Guest profiles are created with preferences and stay details
4. **AI Generation**: OpenAI generates personalized itineraries based on guest profiles and available experiences
5. **Distribution**: QR codes and PDFs are generated for guest access
6. **Guest Access**: Public itinerary view accessible via unique URLs with automatic expiration after checkout
7. **Security Control**: Manager-only editing with automatic QR code deactivation after guest checkout date

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **openai**: AI integration for itinerary generation
- **qrcode**: QR code generation for guest access
- **pdfkit**: PDF document generation for QR codes and full itineraries
- **resend**: Email service for automated guest communication and PDF delivery

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **react-hook-form**: Form state management
- **wouter**: Lightweight routing

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

The application is designed for deployment on Replit with the following build process:

1. **Development**: `npm run dev` starts both Vite dev server and Express API
2. **Build**: `npm run build` compiles the React app and bundles the Express server
3. **Production**: `npm start` runs the production Express server serving static files

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `OPENAI_API_KEY`: OpenAI API key for itinerary generation
- `RESEND_API_KEY`: Resend API key for automated email sending
- `REPLIT_DOMAINS`: Domain configuration for QR code generation

### Database Migration
- Uses Drizzle Kit for schema migrations
- `npm run db:push` applies schema changes to the database
- Migrations are stored in the `/migrations` directory

### File Storage
- QR codes and PDFs are stored in `/uploads` directory
- Public file serving through Express static middleware
- File paths are returned as URLs for frontend consumption

The system is built to be easily deployable on Replit with minimal configuration, using serverless PostgreSQL and file-based storage for generated assets.