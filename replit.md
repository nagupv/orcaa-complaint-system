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

- **Complete Email Notification System Fix - VERIFIED** (July 05, 2025): Successfully resolved critical email notification configuration issue where complainants weren't receiving confirmation emails. Fixed workflow template to properly send confirmation emails to complainants (recipientType: "complainant") and staff notifications to assigned team members. Removed "Latest Update" section from email template for cleaner professional appearance. Updated workflow orchestration to ensure proper email routing with two-stage notification process: 1) Complainant receives immediate confirmation email, 2) Staff receives notification for processing. Verified with AQ-2025-029 test case showing successful dual email delivery to both nagupv@yahoo.com (complainant) and venkat.naga@uzvis.com (staff). **PRODUCTION-READY DUAL EMAIL NOTIFICATIONS - Complainants and staff properly notified.**
- **Production-Ready SendGrid Email Integration Complete - VERIFIED** (July 05, 2025): Successfully upgraded workflow orchestration system from placeholder email logging to full SendGrid email service integration. Implemented @sendgrid/mail package with proper error handling, verified sender authentication (venkat.naga@uzvis.com), and comprehensive audit trail logging. System now sends real professional emails automatically during workflow execution. Verified with AQ-2025-025 test case showing complete email delivery success. Enhanced email service with detailed error logging and graceful fallback handling for unverified senders. **PRODUCTION-READY EMAIL NOTIFICATIONS - Real emails sent automatically through SendGrid.**
- **Complete ReactFlow Workflow Orchestration System Implementation - VERIFIED** (July 05, 2025): Successfully implemented comprehensive workflow orchestration system using ReactFlow with Kahn's algorithm for topological sorting. Built WorkflowOrchestrator service that processes all workflow node types including email notifications, SMS, WhatsApp, task nodes, and decision nodes in proper dependency order. Enhanced email notification system with dynamic template variables and proper recipient handling. Integrated workflow orchestration into complaint creation process with automatic workflow assignment and execution. Verified with multiple test cases including AQ-2025-025 with successful real email delivery. System now provides complete workflow automation with parallel processing, cycle detection, real-time status updates, and comprehensive audit trails. **FULLY TESTED AND OPERATIONAL - All workflow nodes execute correctly with real email notifications.**
- **Critical Workflow Rejection Status Bug Fix - COMPLETED** (July 05, 2025): Successfully resolved critical bug where rejected workflow tasks were incorrectly setting complaint status to "approved" instead of "closed". Enhanced completeWorkflowTask function to accept taskStatus parameter allowing proper differentiation between approved and rejected tasks. Updated determineCompletionStatus function to check task status before edge labels, ensuring rejected tasks properly result in "closed" complaint status. Modified workflow task rejection endpoint to pass "rejected" status. Corrected AQ-2025-013 complaint status from "approved" to "closed" and added comprehensive audit trail. System now properly handles workflow rejections with accurate status tracking for regulatory compliance. **VERIFIED AND TESTED - Bug fix working correctly.**
- **Automatic Complaint Status Update on Workflow Completion** (July 05, 2025): Implemented intelligent workflow completion detection with automatic complaint status updates. System now detects when workflows reach end nodes or have no outgoing edges, automatically updating complaint status to "approved" for successful completion or "closed" for rejection/resolution paths. Added handleWorkflowCompletion method with comprehensive audit trail logging and determineCompletionStatus logic for smart status assignment based on workflow edge labels (no violation, dismissed, rejected → closed; resolved/resolution → closed; default → approved). Enhanced createNextWorkflowTask function to trigger completion when workflows reach terminal states, ensuring regulatory compliance with proper status tracking throughout complaint lifecycle.
- **Critical Workflow Progression Bug Fix** (July 05, 2025): Resolved critical issue in getWorkflowTasks function where multiple filter conditions (complaintId + taskType) were not being combined properly due to sequential .where() calls overriding each other instead of using AND logic. Fixed by implementing proper condition array with Drizzle's and() operator. This bug was causing workflow tasks to fail progression after completion because the system incorrectly detected existing tasks from other complaints. Enhanced createNextWorkflowTask function with improved decision node handling for multiple branching paths. Fixed workflow progression for AQ-2025-009 and AQ-2025-010 complaints, restoring automatic task creation after completion. All future workflows now properly progress through sequential steps without manual intervention.
- **Complete Workflow Node Actions Integration** (July 05, 2025): Enhanced Role-Action Mapping system with all 166 available workflow node types and system actions. Added comprehensive action coverage including all workflow designer nodes (Start, End, Task, Decision, Initial Inspection, Assessment, Enforcement Action, Resolution, Permit Verification, Email Notification, SMS Notification, WhatsApp Notification, and 20+ other workflow components). System now provides granular permission control for every workflow operation with proper role assignments across 5 categories: Application Management (25 actions), Workflow Tasks (106 actions), Complaint Management (10 actions), Time Management (15 actions), and Reporting (10 actions). Fixed data persistence issues and ensured all workflow node permissions are properly saved and displayed.
- **Role-Action Mapping Integration for Workflow Task Assignment** (July 05, 2025): Replaced hardcoded role assignment logic with dynamic Role-Action Mapping system for intelligent workflow task assignment. Created shared roleActionMapping.ts utility with comprehensive action definitions, role mappings, and helper functions. Updated createWorkflowTasksFromWorkflow and createNextWorkflowTask functions to use mapTaskTypeToActionId and getRequiredRolesForAction instead of switch statements. Enhanced audit trail with detailed role assignment logging including actionId, requiredRoles, and assignment rationale. System now assigns tasks based on configurable Role-Action Mapping rather than static role assignments, enabling flexible permission management and proper compliance tracking.
- **WorkflowTaskDetail Component Converted to Dialog Popup** (July 05, 2025): Transformed WorkflowTaskDetail component from bottom-of-page display to modal dialog popup interface. Component now accepts open/onClose props for proper dialog functionality. Removed action buttons (Approve, Reject, Forward) and Audit Trail tab from popup interface as requested, creating a clean read-only view. Streamlined interface shows only Complaint Details and Workflow History tabs with comprehensive complaint information including problem type, contact details, location information, and file attachments. Dialog provides better user experience with max-width of 4xl and scrollable content for viewing detailed complaint context.
- **Fixed Duplicate Complaint Display and Enhanced WorkflowTaskDetail History** (July 05, 2025): Resolved critical duplicate complaint issue in inbox by implementing smart filtering logic that prevents both complaint items and workflow task items from showing for the same complaint. Enhanced filtering to show only the latest workflow task per complaint for each user, with complaint items displayed only when user has no active workflow tasks. Fixed WorkflowTaskDetail component to properly load comprehensive workflow history with all chronological actions taken by previous users across multiple tabs (Complaint Details, Workflow History, Audit Trail, Actions). The "View" button now shows complete complaint context including all previous workflow steps and user actions.
- **Workflow Task Approve, Reject, and Forward Actions Implementation** (July 05, 2025): Restored and enhanced complaint workflow task management functionality with comprehensive action capabilities. Added workflow tasks as separate actionable items in inbox with Approve, Reject, and Forward buttons for pending tasks. Implemented three backend API endpoints with role-based permissions, comprehensive audit trails, and sequential workflow support. Approve action completes tasks and triggers next workflow step automatically. Reject action marks tasks as rejected with detailed logging. Forward action reassigns tasks to other users. All actions require proper authorization and generate complete audit trails for compliance tracking.
- **Enhanced Workflow Designer with Icon-Based Controls & Organized Panels** (July 05, 2025): Completely redesigned Workflow Designer interface with professional icon-based zoom & pan controls positioned in ReactFlow panels. Added top-right panel with compact icon buttons for Zoom In/Out, Fit View, and Center View, plus real-time zoom percentage display. Created top-left Designer Actions panel with Save, Load, Clear, Export, and Example buttons. Enhanced Available Nodes panel with larger icons, descriptions, and hover effects. Improved Connector Types panel with detailed descriptions and better visual hierarchy. Removed redundant controls from below the canvas and organized all functionality into intuitive floating panels for better user experience and professional appearance.
- **Complete URL Hash Navigation System** (July 05, 2025): Implemented comprehensive URL hash navigation for both Application Management and Time Management systems. Added useEffect hooks to listen for hash changes and update active sections accordingly. Updated all header dropdown links to use proper hash URLs (e.g., /application-management#users, /time-management#timesheets). Click handlers now sync URL changes with component state. Fixed useEffect import issue in TimesheetManagement.tsx. Navigation now supports direct linking to specific sections and maintains browser history. System provides seamless navigation between all sub-sections with proper URL representation.
- **Complete Navigation Dropdown System & Hover Link Conversion** (July 05, 2025): Fully converted Application Management to hover link navigation system using anchor tags instead of buttons. Main navigation items (User Management, Role Management, List Values, Workflow Designer, Workflow Templates, Mappings, User Role Report) now styled as bordered hover links with ORCAA blue color scheme. Mappings dropdown also converted to hover links with consistent styling. Added comprehensive dropdown menus to main header navigation for both "Application Management" and "Time Management" links on desktop and mobile. Application Management dropdown shows all 8 sub-sections with logical separators. Time Management dropdown displays Time Entries, Leave Requests, and Overtime Requests. Enhanced professional appearance with consistent dropdown styling and link-based navigation throughout.
- **Fixed Navigation Routing and 404 Errors** (July 05, 2025): Resolved 404 Page Not Found errors by adding proper routing configuration for all navigation menu items. Updated App.tsx with routes for Dashboard (/dashboard), Inbox (/inbox), Time Management (/time-management), Audit Trail (/audit-trail), and Application Management (/application-management). All navigation links now properly route to their corresponding pages with complete functionality.
- **Header Navigation Update to Application-Specific Menu** (July 05, 2025): Replaced generic menu items (Home, Services, Air Quality, Burning, Asbestos, Contact) with application-specific navigation links as URL hyperlinks. New menu includes: Dashboard, Inbox, Time Management, Audit Trail, Application Management, and ORCAA Website (external link). Updated both desktop and mobile navigation menus to reflect the actual application functionality and provide direct access to all main features.
- **Application Management Interface Reorganization** (July 05, 2025): Restructured Application Management by renaming "User & Role Mapping" to "Mappings" and consolidating both User Role Mapping and Role-Action Mapping functionality under this new section. Created nested tabs within Mappings for better organization, with main tabs now being: User Management, Role Management, List Values, Workflow Designer, Workflow Templates, Mappings (containing User & Role Mapping and Role-Action Mapping), and User Role Report. Improved navigation hierarchy and logical grouping of related mapping functionalities.
- **Complete Role-Action Mapping Update Functionality** (July 05, 2025): Implemented full edit and update capabilities for Role-Action Mapping with backend API support. Added PUT endpoint for updating role permissions with admin authentication and audit trail logging. Enhanced frontend with smaller button styling, database-driven permission loading, and proper API integration. Administrators can now modify role permissions with real-time updates to the database and comprehensive validation.
- **Enhanced Workflow Designer UI with Separate Panels** (July 05, 2025): Reorganized workflow designer interface with separate Card panels for Available Nodes and Connector Types, each featuring vertical scrollbars for better organization. Available Nodes panel (250px height) displays all workflow components in single-column layout with larger icons. Connector Types panel (200px height) shows connection options with clear selection feedback. Fixed previous connector display issues and improved overall usability with professional panel-based layout.
- **Workflow Designer Connection Handle Enhancement** (July 05, 2025): Implemented visible connection handles with blue input handles (target) and green output handles (source), enhanced with hover effects and shadows. Added "Load Example Workflow" button to demonstrate connection functionality. Fixed empty state display issue and improved connection visibility for better user interaction.
- **Role-Action Mapping System Implementation** (July 05, 2025): Created comprehensive Role-Action Mapping interface in Application Management that clearly defines which actions each role can perform. Organized permissions into 5 categories: Application Management, Workflow Tasks, Complaint Management, Time Management, and Reporting. Provides visual matrix showing role permissions, editable interface for administrators, and clear documentation of current access controls. Enhanced field mapping for complaint details visibility in workflow tasks. System demonstrates proper permission boundaries for all 5 user roles (admin, supervisor, approver, field_staff, contract_staff).
- **Sequential Workflow Implementation & Task Recovery** (July 05, 2025): Implemented sequential workflow progression where only the next task becomes available after completing the previous one. Modified workflow task creation logic to initially create only the first task instead of all tasks simultaneously. Added automatic next-task creation when a task is completed, ensuring proper workflow sequence control. Enhanced User Management interface with status column displaying "Active" vs "Pending Activation" badges. Fixed missing workflow task issue for complaint AQ-2025-002 with comprehensive workflow task recovery and sequential task generation.
- **Enhanced Workflow Task Details with Complaint Integration & Automatic Workflow Initiation** (July 05, 2025): Significantly enhanced WorkflowTaskDetail component to display comprehensive complaint/notification details including problem type, priority, contact information, location details, description, specific location information, and file attachments. Implemented automatic workflow initiation system that triggers immediately when complaints are received - automatically determines complaint type (Air Quality vs Demolition Notice), assigns appropriate workflow template, creates workflow tasks, generates inbox items for assigned users, and provides comprehensive audit trail. Enhanced complaint creation API with intelligent workflow detection and assignment based on problem type keywords. System now provides complete context for workflow tasks with full complaint visibility and seamless automatic processing.
- **Inbox Functionality Implementation** (July 05, 2025): Replaced Workflow Designer in main navigation with comprehensive Inbox functionality displaying all work assigned to logged-in users. Created tabbed interface showing All Items, Complaints, Approvals, and My Requests with real-time status tracking, priority indicators, and approval/rejection capabilities for leave and overtime requests. Moved Workflow Designer to Application Management for administrative access only.
- **Navigation Structure Reorganization** (July 05, 2025): Moved Workflow Templates from standalone main navigation tab to Application Management submenu, positioned after Workflow Designer. Main navigation now streamlined to Dashboard, Inbox, Time Management, Audit Trail, and Application Management for better user experience and logical feature grouping.
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