# Cocktail & SLUSHi Recipe Library

## Overview

A private web application for managing cocktail and Ninja SLUSHi recipes. Users can add, browse, search, and scale drink recipes with image uploads and tag-based organization. The app supports two recipe types: standard cocktails with flexible text-based ingredients, and SLUSHi recipes with volume-based ingredients that can be scaled within the Ninja SLUSHi's valid range (475ml - 1890ml). Includes a GPT Actions API endpoint for external recipe creation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Design System**: Material Design 3 principles with content-first adaptations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints under `/api/` prefix
- **File Uploads**: Multer for handling image uploads, stored in `/uploads` directory
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Simple password-based access with session cookies for web UI, API key authentication for GPT Actions endpoint

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Key Entities**: recipes, tags, recipeTags (many-to-many), users, session
- **Recipe Types**: Two variants - "cocktail" (flexible text ingredients) and "slushi" (structured ml-based ingredients with volume constraints)

### Authentication Mechanisms
- **Web UI**: Session-based authentication with a single shared password (configured via `APP_PASSWORD` env var)
- **GPT Actions API**: API key authentication via `X-API-Key` header (configured via `API_KEY` env var)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route pages (browse, recipe-detail, add-recipe, login)
    lib/          # Utilities, auth context, query client
    hooks/        # Custom React hooks
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared between client and server
  schema.ts       # Drizzle schema and Zod validators
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Third-Party Services
- **GPT Actions Integration**: POST `/api/gpt/recipes` endpoint allows Custom GPTs to create recipes programmatically

### Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required (provided by Replit) |
| `APP_PASSWORD` | Password for web UI access | `cocktails123` |
| `API_KEY` | API key for GPT Actions endpoint | `recipe-api-key-123` |
| `SESSION_SECRET` | Session encryption secret | Auto-generated |

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `express-session` / `connect-pg-simple`: Session handling
- `multer`: File upload handling
- `zod` / `drizzle-zod`: Schema validation
- Radix UI primitives: Accessible UI components