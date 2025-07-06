# Deployment Guide for ORCAA Complaint Management System

## Overview

This guide provides instructions for deploying the ORCAA Complaint Management System to various environments.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (recommended: Neon Database)
- Required API keys and service accounts

## Environment Setup

### 1. Database Configuration

**For Neon Database (Recommended):**
```bash
# Create a new database project at https://console.neon.tech
# Copy the connection string
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**For local PostgreSQL:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/orcaa_db
```

### 2. Authentication Setup (Replit Auth)

1. **Create Replit Auth Application**
   - Go to https://replit.com/account/auth
   - Create a new application
   - Configure redirect URLs

2. **Environment Variables**
   ```bash
   REPL_ID=your-replit-id
   ISSUER_URL=https://auth.replit.com
   REPLIT_DOMAINS=your-domain.com
   ```

### 3. Email Service Setup (Optional)

**SendGrid Configuration:**
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-sender@domain.com
```

### 4. SMS/WhatsApp Service Setup (Optional)

**Twilio Configuration:**
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=your-twilio-phone-number
```

## Deployment Options

### Option 1: Replit Deployment (Recommended)

1. **Import to Replit**
   - Go to https://replit.com
   - Create new repl from GitHub repository
   - Select Node.js template

2. **Configure Environment Variables**
   - Go to Secrets tab in Replit
   - Add all required environment variables

3. **Deploy**
   - Click Deploy button
   - Configure domain and settings
   - Deploy automatically

### Option 2: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "client/**/*",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "client/index.html"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 3: Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway link
   railway up
   ```

### Option 4: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # Install from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   heroku create orcaa-complaint-system
   ```

3. **Configure Environment Variables**
   ```bash
   heroku config:set DATABASE_URL=your-database-url
   heroku config:set SESSION_SECRET=your-session-secret
   heroku config:set REPL_ID=your-repl-id
   # Add other environment variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Database Migration

### Initial Setup

1. **Push Database Schema**
   ```bash
   npm run db:push
   ```

2. **Seed Initial Data (Optional)**
   ```bash
   npm run db:seed
   ```

### Production Considerations

1. **Environment Variables**
   - Use strong SESSION_SECRET
   - Configure proper CORS origins
   - Set NODE_ENV=production

2. **Database Security**
   - Use SSL connections
   - Implement proper backup strategy
   - Monitor database performance

3. **File Upload Security**
   - Configure file size limits
   - Implement virus scanning
   - Use proper storage permissions

## Post-Deployment Checklist

### 1. Verify Core Functionality
- [ ] Public complaint submission works
- [ ] User authentication works
- [ ] Database connections are stable
- [ ] File uploads work properly

### 2. Configure Admin Access
- [ ] Set ADMIN_EMAILS environment variable
- [ ] Test admin user creation
- [ ] Verify role assignments

### 3. Test Notification Systems
- [ ] Email notifications (if configured)
- [ ] SMS notifications (if configured)
- [ ] WhatsApp notifications (if configured)

### 4. Performance Monitoring
- [ ] Set up application monitoring
- [ ] Configure error tracking
- [ ] Monitor database performance
- [ ] Check memory usage

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure SSL is properly configured

2. **Authentication Issues**
   - Verify REPL_ID and ISSUER_URL
   - Check redirect URLs configuration
   - Ensure SESSION_SECRET is set

3. **File Upload Issues**
   - Check file size limits
   - Verify uploads directory permissions
   - Ensure proper CORS configuration

4. **Email/SMS Not Working**
   - Verify API keys are correct
   - Check service account permissions
   - Review rate limiting settings

### Debugging Tools

1. **Application Logs**
   ```bash
   # View application logs
   npm run logs
   
   # View specific service logs
   heroku logs --tail
   railway logs
   ```

2. **Database Debugging**
   ```bash
   # Open Drizzle Studio
   npm run db:studio
   
   # Check database connection
   npm run db:check
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use strong, unique secrets
   - Rotate keys regularly

2. **Database Security**
   - Use SSL connections
   - Implement proper access controls
   - Regular security updates

3. **File Upload Security**
   - Validate file types
   - Implement virus scanning
   - Use secure storage

4. **Authentication Security**
   - Use secure session cookies
   - Implement proper CORS
   - Regular security audits

## Maintenance

### Regular Tasks

1. **Database Maintenance**
   - Regular backups
   - Performance monitoring
   - Index optimization

2. **Security Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular penetration testing

3. **Performance Monitoring**
   - Monitor response times
   - Track error rates
   - Optimize slow queries

### Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Weekly full backups
   - Monthly backup verification

2. **File Backups**
   - Backup uploaded files
   - Implement redundancy
   - Test restore procedures

## Support

For deployment issues:
1. Check the application logs
2. Review this deployment guide
3. Contact the development team
4. Create an issue in the GitHub repository

---

**Note**: This deployment guide is specific to the ORCAA Complaint Management System. Adjust configurations based on your specific environment and requirements.