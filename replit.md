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

- **Workflow Templates by Complaint Type Integration** (July 05, 2025): Implemented complete workflow template system allowing administrators to configure default workflows for Air Quality complaints and Demolition Notices. Added workflow template management interface with template assignment controls, automatic workflow assignment during complaint creation, and comprehensive template configuration API. Enhanced database schema with workflow linking to complaints, template designation flags, and complaint type associations. New complaints automatically receive appropriate workflow templates based on their type.
- **Enhanced Notification Component Configuration** (July 05, 2025): Completed comprehensive configuration functionality for Email, SMS, and WhatsApp notification components in workflow designer. Email notifications now support "To Email Account" and "CC Email Account" fields with recipient type selection and custom email options. SMS notifications include from phone number configuration and template customization. WhatsApp notifications feature from number setup, message templates with emoji support, and media attachment options. All notification components support dynamic variable templates (complaintId, status, description, date) and proper validation.
- **Workflow Designer Empty State & Clear Function** (July 05, 2025): Modified workflow designer to start with empty state instead of pre-populated nodes. Added "Clear Designer" button for resetting workflow canvas. Improved left panel space efficiency by making node components more compact with smaller icons and text. Enhanced user experience with cleaner interface and better space utilization.
- **Complete Workflow Save/Load Management System** (July 05, 2025): Implemented full workflow persistence with save, load, update, and delete capabilities. Added workflow database table with JSONB storage for nodes, edges, and analytics data. Created comprehensive workflow management dialogs with name and description fields, workflow listing with creation dates, and complete CRUD operations. Enhanced workflow designer with professional save/load interface supporting workflow templates and reusable design patterns.
- **Enhanced Workflow Designer with SMS/WhatsApp & Advanced Analytics** (July 05, 2025): Extended ReactFlow workflow designer with SMS and WhatsApp notification components, bringing total to 11 specialized nodes. Added advanced zoom and pan controls (Zoom In/Out, Fit View, Center) with real-time zoom percentage display. Implemented comprehensive analytics reporting including node type distribution, connection type analysis, workflow complexity assessment, and enhanced JSON export with analytics data. Added professional zoom controls and workflow insights for complete project management visualization.
- **Removed User Info Box from TimeSheet Interface** (July 04, 2025): Removed redundant current user information display from TimeSheet management page to save screen space while preserving week selector functionality
- **Removed Duplicate Week Dropdown** (July 04, 2025): Fixed duplicate week selector display in Time Entries screen by removing redundant dropdown that appeared above the timesheet content, keeping only the properly positioned one in the Time Entries card header.
- **Authentication-Integrated User Management** (July 04, 2025): Enhanced User Management system with proper authentication integration. User creation now creates pending profiles that require Replit Auth activation. User deletion performs soft deletion by deactivating accounts and revoking system access immediately while preserving audit trail. Added real-time active user verification in authentication middleware.
- **Fixed Leave/Overtime Request Display** (July 04, 2025): Resolved critical data rendering bug where leave requests and overtime requests weren't displaying due to incorrect query result property access. Fixed conditional logic for proper data rendering in TimeSheet management interface.
- **Removed User Info Box from TimeSheet Interface** (July 04, 2025): Removed redundant current user information display from TimeSheet management page to save screen space while preserving week selector functionality
- **Complete Leave and Overtime Request System** (July 04, 2025): Implemented comprehensive HR functionality with leave request forms (8 leave types), overtime request system with project tracking, role-based approval/rejection workflow, and status tracking tables with proper validation
- **TimeSheet Tabular Layout** (July 04, 2025): Converted time entries from card-based layout to clean tabular format with columns for Date, Hours, Activity, Work ID, Comments, and Actions. Improved data density and scanning efficiency with proper column alignment, truncated comments with tooltips, and consistent iconography.
- **GitHub Contributions-Style Heatmap & Color-Coded Widgets** (July 04, 2025): Added GitHub contributions-style heatmap chart showing daily time tracking patterns over the last 6 months with green intensity levels (0-4 scale). Implemented color-coded time allocation widgets for both activities and work IDs, featuring progress bars, percentages, and distinct color schemes. Enhanced timesheet visualization with three comprehensive data representation methods.
- **TimeSheet Summary Tables** (July 04, 2025): Added comprehensive tabular summaries displaying time spent by Day/Week and Activity, as well as by Day/Week and Work ID. Four summary tables provide detailed breakdowns with totals: Daily Activity Summary, Weekly Activity Summary, Daily Work ID Summary, and Weekly Work ID Summary. Tables are responsive and only display when timesheet data exists.
- **TimeSheet Business Work ID Autocomplete Enhancement** (July 04, 2025): Replaced dropdown selection with free text input featuring autocomplete functionality. Business Work ID field now provides suggestions via HTML datalist while maintaining backend validation against existing complaint numbers. Improved user experience for handling large numbers of complaint IDs.
- **TimeSheet Business Work ID Validation** (July 04, 2025): Enhanced TimeSheet functionality with complaint ID validation. Business Work ID field now cross-checks against valid complaint numbers from the database. Added dropdown selection with all valid complaint IDs, preventing invalid entries and improving data integrity.
- **TimeSheet Functionality Implementation** (July 04, 2025): Added comprehensive TimeSheet management system with user time tracking, activity selection from List Values, date calendar lookup, business work ID linking, and comments. Integrated database schema with timesheets table, API routes, and frontend component. Added 12 predefined timesheet activities and positioned TimeSheet tab after Workflow Management in navigation.
- **List Values Critical Bug Fix** (July 04, 2025): Resolved critical API parameter order bug that was preventing List Values creation. Fixed all CRUD operations to use correct apiRequest format (method, url, data). Added mandatory field asterisk (*) indicators to all required fields in Create New List Value form. System now fully operational with successful creation, updating, and deletion of list values.
- **List Values Functionality** (July 04, 2025): Added comprehensive List Values management with CRUD operations for configuration values, including fields for list_value_code, list_value_descr, order, and list_value. Integrated as new tab in Application Management with full database schema and API endpoints
- **Removed Public Complaint Form for Signed-in Users** (July 04, 2025): Eliminated public complaint form access from authenticated dashboard, ensuring staff only see internal management tools
- **ORCAA Logo Integration** (July 04, 2025): Downloaded and integrated official ORCAA logo from orcaa.org website into application header and landing page for authentic branding
- **User Management Table Layout** (July 04, 2025): Converted user display from card-based layout to clean tabular format with organized columns for Name, Email, Contact Details, Roles, Notifications, and Actions
- **Complete User CRUD Operations** (July 04, 2025): Implemented full user management with update and delete functionality, including main screen editing form for all fields except email, role-based permissions, and comprehensive audit trail logging
- **Complete Application Management System** (July 04, 2025): Restructured User Management into comprehensive Application Management with 4 modules: User Management, Role Management, User and Role Mapping, User Role Report. Added roles database table with full CRUD operations and role seeding functionality
- **WhatsApp and SMS Integration** (July 04, 2025): Enhanced user management with WhatsApp account and mobile number fields for Twilio SMS/WhatsApp notifications. Added notification preferences and enhanced Twilio service with user-based notification functions
- **Navigation Layout Fix** (July 04, 2025): Fixed horizontal tab navigation display using flex layout instead of grid to ensure tabs appear in a single line
- **Multiple Roles System** (July 04, 2025): Migrated from single role to multiple roles architecture with JSONB array storage, enabling users to have multiple role assignments simultaneously
- **Header and Footer Integration** (July 04, 2025): Added ORCAA.org-styled header and footer components with navigation, contact information, and branding consistent with the official ORCAA website
- **Enhanced Service Selection** (July 04, 2025): Added functional help buttons for contacting ORCAA and viewing regulations

## Changelog

Changelog:
- July 04, 2025. Initial setup