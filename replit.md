# Triphita Blog Management System

## Overview

This is a full-stack blog management system built with React, Express.js, and PostgreSQL. The application provides a complete admin dashboard for managing blog posts with features like creating, editing, deleting, and organizing content. It uses modern technologies including TypeScript, Drizzle ORM, and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Added MySQL database support: Converted from in-memory storage to persistent MySQL database (July 2025)
- Created dual storage system: Environment variable controls MySQL vs in-memory storage
- Built comprehensive MySQL schema with proper indexing and JSON support for tags
- Added database setup scripts and detailed documentation for local deployment
- Fixed draft filter issue: Updated API to properly apply multiple filters simultaneously (July 2025)
- Fixed form submission issue: Added proper submit button for publishing posts (January 2025)
- Resolved SelectItem component errors by using non-empty values for filters
- Fixed TypeScript errors in storage layer for proper type safety
- Updated form validation and submission flow for better user experience

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: MySQL with Drizzle ORM (configurable to in-memory for development)
- **Database Provider**: Local MySQL or cloud MySQL services
- **API Pattern**: RESTful APIs with proper error handling
- **Session Management**: Built-in session handling for development
- **Storage Layer**: Interface-based design allowing easy switching between MySQL and in-memory storage

## Key Components

### Database Schema
- **Users Table**: Basic user management with username/password authentication
- **Blog Posts Table**: Comprehensive blog post management with fields for:
  - Title, content, excerpt
  - Category, status (draft/published/scheduled)
  - Featured image, meta description
  - Tags (JSON array), publish date
  - Created/updated timestamps with automatic updates
  - Optimized with indexes on status, category, and date fields

### Frontend Components
- **Dashboard**: Overview with statistics and post management
- **Post Management**: Create, edit, delete blog posts
- **Rich Text Editor**: Custom HTML-based editor for content creation
- **Responsive Design**: Mobile-friendly interface with sidebar navigation
- **Data Tables**: Sortable, searchable post listings with filters

### API Endpoints
- `GET /api/blog-posts` - List all posts with optional filtering
- `GET /api/blog-posts/stats` - Get post statistics
- `GET /api/blog-posts/:id` - Get specific post
- `POST /api/blog-posts` - Create new post
- `PUT /api/blog-posts/:id` - Update existing post
- `DELETE /api/blog-posts/:id` - Delete post

## Data Flow

1. **Client Requests**: Frontend makes API calls using fetch with proper error handling
2. **Server Processing**: Express routes handle requests, validate data with Zod schemas
3. **Database Operations**: Drizzle ORM manages all database interactions
4. **Response Handling**: Structured JSON responses with proper HTTP status codes
5. **Client Updates**: React Query manages caching and UI updates

## External Dependencies

### Core Framework Dependencies
- React 18 with TypeScript support
- Express.js for server-side API
- Drizzle ORM with MySQL dialect
- MySQL2 driver for database connectivity
- Dual storage system (MySQL + in-memory fallback)

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- Lucide React for consistent iconography
- shadcn/ui for pre-built component library

### Development Tools
- Vite for fast development builds
- ESBuild for production bundling
- TypeScript for type safety
- Replit-specific plugins for development environment

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with hot module replacement
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Neon Database with connection pooling
- **Integration**: Unified development server serving both frontend and API

### Production Build
- **Frontend**: Static files built with Vite and served by Express
- **Backend**: Bundled with ESBuild for optimized Node.js execution
- **Database**: Production Neon Database with environment variables
- **Deployment**: Single Node.js process serving both static assets and API

### Configuration Management
- Environment variables for database connections
- Separate configurations for development and production
- Path aliases for clean imports (@/, @shared/)
- Type-safe configuration with TypeScript

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and optimized for both development experience and production performance.