#!/bin/bash

# ORCAA Complaint Management System - GitHub Setup Script
# This script prepares the project for GitHub repository creation

echo "🚀 Setting up ORCAA Complaint Management System for GitHub..."

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "📦 Git repository already exists"
fi

# Create uploads directory with gitkeep if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir uploads
fi

if [ ! -f "uploads/.gitkeep" ]; then
    echo "📁 Creating uploads/.gitkeep to preserve directory structure..."
    touch uploads/.gitkeep
    echo "✅ uploads/.gitkeep created"
fi

# Add all files to git
echo "📝 Adding files to git..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    echo "📝 No changes to commit"
else
    # Create initial commit
    echo "📝 Creating initial commit..."
    git commit -m "Initial commit: ORCAA Complaint Management System

Features:
- Complete complaint management workflow system
- Role-based access control with 5 user roles
- Visual workflow designer with ReactFlow
- Public complaint submission and search
- Advanced search and export (Excel/PDF)
- Time tracking and leave management
- Email/SMS/WhatsApp notifications
- Comprehensive audit trail
- React + TypeScript frontend
- Express.js + PostgreSQL backend
- Drizzle ORM with type safety
- Replit Auth integration
- SendGrid email service
- Twilio SMS/WhatsApp service

Environment:
- Production-ready authentication system
- Intelligent domain resolution for deployment
- Persistent admin role management
- Complete workflow orchestration
- Advanced analytics and reporting"

    echo "✅ Initial commit created"
fi

# Display next steps
echo ""
echo "🎉 Repository setup complete!"
echo ""
echo "Next steps to push to GitHub:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: orcaa-complaint-system"
echo "   - Description: A comprehensive web application for managing air quality complaints for ORCAA"
echo "   - Make it public or private as needed"
echo "   - Don't initialize with README, .gitignore, or license (we already have them)"
echo ""
echo "2. Add GitHub remote and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/orcaa-complaint-system.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Optionally, add collaborators and set up branch protection rules"
echo ""
echo "📋 Repository Information:"
echo "   - Name: orcaa-complaint-system"
echo "   - Description: Air quality complaint management system for ORCAA"
echo "   - Technology: React, TypeScript, Express.js, PostgreSQL"
echo "   - License: MIT"
echo "   - Documentation: README.md, DEPLOYMENT.md, CONTRIBUTING.md"
echo ""
echo "🔒 Security Notes:"
echo "   - Environment variables are excluded via .gitignore"
echo "   - Use .env.example as template for configuration"
echo "   - Set up GitHub Secrets for CI/CD if needed"
echo "   - Upload directory is excluded (contains user files)"
echo ""
echo "✨ Your ORCAA Complaint Management System is ready for GitHub!"