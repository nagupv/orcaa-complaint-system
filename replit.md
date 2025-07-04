# ORCAA Complaint Management System

## Overview

This is a full-stack web application for managing air quality complaints for ORCAA (Olympic Region Clean Air Agency). The system enables public users to submit complaints about air quality issues, while providing internal staff with tools to track, manage, and resolve these complaints through a structured workflow.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom ORCAA color scheme
- **UI Components**: Radix UI components via shadcn/ui library
- **State Management**: React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Build System
- **Frontend Bundler**: Vite
- **Backend Bundler**: ESBuild
- **Development**: TSX for TypeScript execution
- **CSS Processing**: PostCSS with Tailwind CSS

## Key Components

### Database Schema
- **Users**: Stores user information with multiple role support (field_staff, contract_staff, supervisor, approver, admin) - each user can have multiple roles stored as JSONB array
- **Complaints**: Main complaint records with auto-generated IDs (format: AQ-YYYY-NNN for air quality, DN-YYYY-NNN for demolition)
- **Workflow Stages**: Configurable workflow stages for complaint processing
- **Attachments**: File storage for complaint evidence (images/videos up to 14MB)
- **Audit Trail**: Complete audit log of all complaint actions
- **Sessions**: Session storage for authentication

### Authentication System
- Integrated Replit Auth with OpenID Connect
- Role-based access control with 5 user roles
- Session management with PostgreSQL storage
- Automatic user provisioning and profile management

### File Upload System
- Multer-based file handling for images and videos
- 14MB file size limit per ORCAA requirements
- Local file storage with unique filename generation
- Support for multiple file formats (JPEG, PNG, MP4, etc.)

### Notification System
- Twilio integration for SMS and WhatsApp notifications
- Configurable notification triggers for workflow events
- Graceful fallback when Twilio is not configured

## Data Flow

1. **Public Complaint Submission**: Users submit complaints through a public form with optional anonymity
2. **Workflow Processing**: Complaints move through configurable stages (Initiated → Inspection → Work in Progress → etc.)
3. **Role-Based Assignment**: Each workflow stage is assigned to specific user roles
4. **Audit Trail**: All actions are logged with timestamps and user information
5. **File Attachments**: Evidence files are uploaded and linked to complaints
6. **Notifications**: Automated notifications sent at key workflow transitions

## External Dependencies

### Required Services
- **Neon Database**: PostgreSQL database hosting
- **Replit Auth**: Authentication service (requires REPL_ID and ISSUER_URL)

### Optional Services
- **Twilio**: SMS and WhatsApp notifications (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit application identifier
- `ISSUER_URL`: OpenID Connect issuer URL
- `TWILIO_*`: Twilio service credentials (optional)

## Deployment Strategy

### Development
- `npm run dev`: Runs development server with hot reload
- Vite development server with Express backend
- TypeScript compilation with strict mode
- Database migrations with Drizzle Kit

### Production
- `npm run build`: Builds both frontend and backend
- `npm start`: Runs production server
- Frontend assets served from Express
- ESBuild bundles backend code
- Database schema managed via `npm run db:push`

### File Structure
- `client/`: React frontend application
- `server/`: Express backend application
- `shared/`: Shared TypeScript schemas and types
- `migrations/`: Database migration files
- `uploads/`: File storage directory

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **WhatsApp and SMS Integration** (July 04, 2025): Enhanced user management with WhatsApp account and mobile number fields for Twilio SMS/WhatsApp notifications. Added notification preferences and enhanced Twilio service with user-based notification functions
- **Navigation Layout Fix** (July 04, 2025): Fixed horizontal tab navigation display using flex layout instead of grid to ensure tabs appear in a single line
- **Multiple Roles System** (July 04, 2025): Migrated from single role to multiple roles architecture with JSONB array storage, enabling users to have multiple role assignments simultaneously
- **Header and Footer Integration** (July 04, 2025): Added ORCAA.org-styled header and footer components with navigation, contact information, and branding consistent with the official ORCAA website
- **Enhanced Service Selection** (July 04, 2025): Added functional help buttons for contacting ORCAA and viewing regulations

## Changelog

Changelog:
- July 04, 2025. Initial setup