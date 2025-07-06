# ORCAA Complaint Management System

A comprehensive web application for managing air quality complaints for ORCAA (Olympic Region Clean Air Agency). The system enables public users to submit complaints about air quality issues, while providing internal staff with tools to track, manage, and resolve these complaints through a structured workflow.

## Features

### Public Features
- **Public Complaint Submission**: Citizens can submit air quality complaints with optional anonymity
- **Public Complaint Search**: Search and track complaint status by complaint ID
- **File Upload Support**: Attach images and videos (up to 14MB) as evidence

### Staff Features
- **Dashboard**: Comprehensive overview with statistics and analytics
- **Workflow Management**: Automated task assignment and progress tracking
- **Role-Based Access Control**: 5 user roles with granular permissions
- **Time Tracking**: Timesheet management with activity tracking
- **Leave Management**: Leave and overtime request system
- **Advanced Search & Export**: Excel and PDF export capabilities
- **Inbox System**: Centralized work assignment and notifications
- **Audit Trail**: Complete audit log of all actions

### Administrative Features
- **User Management**: Create and manage user accounts with role assignments
- **Role Management**: Define and manage user roles and permissions
- **Workflow Designer**: Visual workflow builder with ReactFlow
- **Template Management**: Configure workflow templates by complaint type
- **Email Templates**: Customizable email notifications
- **List Values**: Manage dropdown and configuration values

## Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components via shadcn/ui
- **React Query** for state management
- **Wouter** for routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Replit Auth** with OpenID Connect
- **SendGrid** for email notifications
- **Twilio** for SMS/WhatsApp (optional)

### Database
- **PostgreSQL** (Neon Database)
- **Drizzle ORM** for database operations
- **Session storage** with PostgreSQL

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit Auth configuration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/orcaa-complaint-system.git
   cd orcaa-complaint-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file with the following variables:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # Session
   SESSION_SECRET=your-session-secret-key
   
   # Authentication (Replit Auth)
   REPL_ID=your-replit-id
   ISSUER_URL=your-issuer-url
   REPLIT_DOMAINS=your-domain.replit.dev
   
   # Email (SendGrid - Optional)
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=your-verified-sender@domain.com
   
   # SMS/WhatsApp (Twilio - Optional)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_FROM_NUMBER=your-twilio-phone-number
   
   # Admin Configuration
   ADMIN_EMAILS=admin@domain.com,admin2@domain.com
   ```

4. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   
   # Optional: Generate database migrations
   npm run db:generate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Public Interface: `http://localhost:5000`
   - Admin Login: `http://localhost:5000/api/login`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   ├── replitAuth.ts     # Authentication setup
│   └── services/         # Business logic services
├── shared/                 # Shared TypeScript types
│   ├── schema.ts         # Database schema
│   └── roleActionMapping.ts # Permission definitions
├── scripts/               # Build and deployment scripts
├── uploads/               # File upload directory
└── package.json
```

## Database Schema

### Core Tables
- **users**: User accounts with role assignments
- **complaints**: Air quality complaint records
- **workflow_tasks**: Task assignments and progress
- **attachments**: File uploads linked to complaints
- **audit_entries**: Complete audit trail
- **sessions**: Authentication sessions

### Management Tables
- **roles**: User role definitions
- **role_action_mappings**: Permission matrix
- **workflows**: Workflow definitions
- **email_templates**: Email template management
- **list_values**: Configuration values

## User Roles

1. **Admin**: Full system access and configuration
2. **Supervisor**: Oversight and approval capabilities
3. **Approver**: Review and approval permissions
4. **Field Staff**: Complaint investigation and resolution
5. **Contract Staff**: Limited access for external contractors

## Workflow System

The system includes a visual workflow designer built with ReactFlow:

- **Workflow Designer**: Drag-and-drop interface for creating workflows
- **Node Types**: Start, Task, Decision, Email, SMS, WhatsApp, End nodes
- **Template System**: Pre-configured workflows for complaint types
- **Automatic Assignment**: Role-based task assignment
- **Progress Tracking**: Real-time workflow status updates

## API Endpoints

### Public APIs
- `POST /api/complaints` - Submit new complaint
- `GET /api/complaints/public-search/:id` - Search complaints publicly

### Authenticated APIs
- `GET /api/complaints` - List complaints with filtering
- `GET /api/complaints/export` - Export complaint data
- `POST /api/workflow-tasks/:id/complete` - Complete workflow task
- `GET /api/inbox` - User inbox items
- `GET /api/users` - User management
- `POST /api/roles` - Role management

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:push     # Push schema to database
npm run db:generate # Generate migrations
npm run db:studio   # Open Drizzle Studio

# TypeScript
npm run type-check  # Check TypeScript errors
```

### Development Guidelines

1. **Database Changes**: Always update `shared/schema.ts` first
2. **API Changes**: Update storage interface in `server/storage.ts`
3. **Frontend**: Use React Query for server state management
4. **Authentication**: All authenticated routes require proper role checking
5. **File Uploads**: Handle via Multer with 14MB limit

## Deployment

### Environment Variables
Ensure all required environment variables are set for production:
- Database connection with SSL
- Authentication provider configuration
- Email service credentials (if using notifications)
- Session secret for security

### Database Migration
```bash
npm run db:push
```

### Build and Start
```bash
npm run build
npm start
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make changes and test thoroughly**
4. **Update documentation** if needed
5. **Submit a pull request**

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Review the comprehensive help documentation within the application

## Acknowledgments

- Built for Olympic Region Clean Air Agency (ORCAA)
- Uses modern web technologies for optimal performance
- Designed with regulatory compliance in mind
- Comprehensive audit trail for transparency

---

**Note**: This system handles sensitive environmental data. Ensure proper security measures are in place when deploying to production environments.