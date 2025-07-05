import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertComplaintSchema, insertWorkDescriptionSchema, insertAuditSchema, insertListValueSchema, insertEmailTemplateSchema, users, type EmailTemplate } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { handleFileUpload } from "./services/fileUpload";
import { sendSMSNotification } from "./services/twilioService";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { ValidationError } from "zod-validation-error";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 14 * 1024 * 1024 }, // 14MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public complaint form submission
  app.post('/api/complaints', async (req, res) => {
    try {
      const validatedData = insertComplaintSchema.parse(req.body);
      const complaint = await storage.createComplaint(validatedData);
      
      // Create audit entry
      await storage.createAuditEntry({
        complaintId: complaint.id,
        action: 'created',
        newValue: JSON.stringify(complaint),
        userId: null,
        reason: 'Initial complaint submission'
      });

      // **AUTOMATIC WORKFLOW INITIATION** - Get workflow template for complaint type
      let workflowAssigned = false;
      try {
        // Determine complaint type based on problem type or service type
        let complaintType = 'AIR_QUALITY'; // Default
        if (complaint.problemType?.toLowerCase().includes('demolition') || 
            complaint.problemType?.toLowerCase().includes('asbestos')) {
          complaintType = 'DEMOLITION_NOTICE';
        }

        // Find and assign appropriate workflow template
        const template = await storage.getTemplateForComplaintType(complaintType);
        if (template) {
          // Assign workflow to complaint
          await storage.assignWorkflowToComplaint(complaint.id, template.id);
          
          // Create workflow tasks from template
          const tasks = await storage.createWorkflowTasksFromWorkflow(complaint.id, template.id);
          
          // Create audit entry for automatic workflow assignment
          await storage.createAuditEntry({
            complaintId: complaint.id,
            action: 'workflow_auto_assigned',
            newValue: `Workflow "${template.name}" auto-assigned with ${tasks.length} tasks created`,
            userId: null,
            reason: `Automatic workflow initiation for ${complaintType} complaint`
          });

          // Create inbox items for each task
          for (const task of tasks) {
            await storage.createInboxItem({
              userId: task.assignedTo,
              itemType: 'WORKFLOW_TASK',
              itemId: task.id, // Set the required itemId field
              title: `New Task: ${task.taskName}`,
              description: `${task.taskType.replace(/_/g, ' ')} for complaint ${complaint.complaintId}`,
              priority: task.priority,
              workflowTaskId: task.id,
              complaintId: complaint.id,
              isRead: false
            });
          }

          workflowAssigned = true;
          console.log(`Workflow "${template.name}" automatically assigned to complaint ${complaint.complaintId} with ${tasks.length} tasks`);
        } else {
          console.log(`No workflow template found for complaint type: ${complaintType}`);
        }
      } catch (workflowError) {
        console.error('Error in automatic workflow assignment:', workflowError);
        // Continue processing even if workflow assignment fails
      }

      // Send SMS notification if workflow configured
      const workflowStages = await storage.getWorkflowStages();
      const initialStage = workflowStages.find(stage => stage.name === 'initiated');
      if (initialStage && initialStage.smsNotification) {
        // Find users with the assigned role
        const users = await storage.getAllUsers();
        const assignedUsers = users.filter(user => {
          const userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
          return userRoles.includes(initialStage.assignedRole);
        });
        
        for (const user of assignedUsers) {
          if (user.phone) {
            await sendSMSNotification(
              user.phone,
              `New complaint ${complaint.complaintId} received and workflow ${workflowAssigned ? 'automatically initiated' : 'ready for assignment'}. Please check the ORCAA system.`
            );
          }
        }
      }

      res.json({
        ...complaint,
        workflowAutoAssigned: workflowAssigned
      });
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? "Invalid complaint data" 
          : "Failed to create complaint" 
      });
    }
  });

  // File upload for complaints
  app.post('/api/complaints/:id/attachments', upload.single('file'), async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const attachment = await storage.createAttachment({
        complaintId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
      });

      res.json(attachment);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Protected routes - require authentication
  app.get('/api/complaints', isAuthenticated, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        problemType: req.query.problemType as string,
        assignedTo: req.query.assignedTo as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
      };

      const complaints = await storage.getComplaints(filters);
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  // Statistics endpoint - must come before /:id route
  app.get('/api/complaints/statistics', isAuthenticated, async (req, res) => {
    try {
      const statistics = await storage.getComplaintStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Chart data endpoints for dashboard - must come before /:id route
  app.get('/api/complaints/monthly-stats', isAuthenticated, async (req, res) => {
    try {
      const monthlyStats = await storage.getMonthlyComplaintStats();
      res.json(monthlyStats);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      res.status(500).json({ error: 'Failed to fetch monthly statistics' });
    }
  });

  app.get('/api/complaints/yearly-stats', isAuthenticated, async (req, res) => {
    try {
      const yearlyStats = await storage.getYearlyComplaintStats();
      res.json(yearlyStats);
    } catch (error) {
      console.error('Error fetching yearly stats:', error);
      res.status(500).json({ error: 'Failed to fetch yearly statistics' });
    }
  });

  app.get('/api/complaints/:id', isAuthenticated, async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      if (isNaN(complaintId)) {
        return res.status(400).json({ message: "Invalid complaint ID" });
      }
      const complaint = await storage.getComplaint(complaintId);
      
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Map database fields to frontend expected format
      const mappedComplaint = {
        ...complaint,
        // Contact information mapping
        contactName: `${complaint.complainantFirstName || ''} ${complaint.complainantLastName || ''}`.trim(),
        contactEmail: complaint.complainantEmail,
        contactPhone: complaint.complainantPhone,
        // Location mapping
        address: complaint.sourceAddress,
        city: complaint.sourceCity,
        state: complaint.complainantState,
        zipCode: complaint.workSiteZip || complaint.complainantZipCode,
        // Description mapping
        description: complaint.otherDescription,
        problemType: Array.isArray(complaint.problemTypes) ? complaint.problemTypes.join(', ') : complaint.problemTypes,
        specificLocation: complaint.workSiteAddress,
        // Additional fields
        latitude: null, // Not in current schema
        longitude: null // Not in current schema
      };

      res.json(mappedComplaint);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      res.status(500).json({ message: "Failed to fetch complaint" });
    }
  });

  app.put('/api/complaints/:id', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const originalComplaint = await storage.getComplaint(complaintId);
      if (!originalComplaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      const updatedComplaint = await storage.updateComplaint(complaintId, req.body);
      
      // Create audit entry for changes
      const changes = [];
      for (const [key, value] of Object.entries(req.body)) {
        if (originalComplaint[key as keyof typeof originalComplaint] !== value) {
          changes.push({
            field: key,
            from: originalComplaint[key as keyof typeof originalComplaint],
            to: value
          });
        }
      }

      if (changes.length > 0) {
        await storage.createAuditEntry({
          complaintId,
          action: 'updated',
          previousValue: JSON.stringify(originalComplaint),
          newValue: JSON.stringify(updatedComplaint),
          userId,
          reason: `Updated fields: ${changes.map(c => c.field).join(', ')}`
        });
      }

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({ message: "Failed to update complaint" });
    }
  });

  app.put('/api/complaints/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { status, reason } = req.body;

      const originalComplaint = await storage.getComplaint(complaintId);
      if (!originalComplaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      const updatedComplaint = await storage.updateComplaint(complaintId, { status });
      
      // Create audit entry for status change
      await storage.createAuditEntry({
        complaintId,
        action: 'status_changed',
        previousValue: originalComplaint.status,
        newValue: status,
        userId,
        reason: reason || `Status changed from ${originalComplaint.status} to ${status}`
      });

      // Send SMS notification for status change
      if (updatedComplaint.assignedTo) {
        const assignedUser = await storage.getUser(updatedComplaint.assignedTo);
        if (assignedUser && assignedUser.phone) {
          await sendSMSNotification(
            assignedUser.phone,
            `Complaint ${updatedComplaint.complaintId} status updated to ${status}.`
          );
        }
      }

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error updating complaint status:", error);
      res.status(500).json({ message: "Failed to update complaint status" });
    }
  });

  app.put('/api/complaints/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { assignedTo } = req.body;

      const originalComplaint = await storage.getComplaint(complaintId);
      if (!originalComplaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      const updatedComplaint = await storage.updateComplaint(complaintId, { assignedTo });
      
      // Create audit entry for assignment
      await storage.createAuditEntry({
        complaintId,
        action: 'assigned',
        previousValue: originalComplaint.assignedTo,
        newValue: assignedTo,
        userId,
        reason: `Complaint assigned to user ${assignedTo}`
      });

      // Send SMS notification to assigned user
      if (assignedTo) {
        const assignedUser = await storage.getUser(assignedTo);
        if (assignedUser && assignedUser.phone) {
          await sendSMSNotification(
            assignedUser.phone,
            `Complaint ${updatedComplaint.complaintId} has been assigned to you.`
          );
        }
      }

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error assigning complaint:", error);
      res.status(500).json({ message: "Failed to assign complaint" });
    }
  });



  // Work descriptions
  app.post('/api/complaints/:id/work-descriptions', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const validatedData = insertWorkDescriptionSchema.parse({
        ...req.body,
        complaintId,
        userId
      });

      const workDescription = await storage.createWorkDescription(validatedData);
      
      // Create audit entry
      await storage.createAuditEntry({
        complaintId,
        action: 'work_description_added',
        newValue: workDescription.description,
        userId,
        reason: 'Work description added'
      });

      res.json(workDescription);
    } catch (error) {
      console.error("Error adding work description:", error);
      res.status(400).json({ message: "Failed to add work description" });
    }
  });

  app.get('/api/complaints/:id/work-descriptions', isAuthenticated, async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const descriptions = await storage.getWorkDescriptions(complaintId);
      res.json(descriptions);
    } catch (error) {
      console.error("Error fetching work descriptions:", error);
      res.status(500).json({ message: "Failed to fetch work descriptions" });
    }
  });

  // Workflow management
  app.get('/api/workflow-stages', isAuthenticated, async (req, res) => {
    try {
      const stages = await storage.getWorkflowStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching workflow stages:", error);
      res.status(500).json({ message: "Failed to fetch workflow stages" });
    }
  });

  app.put('/api/workflow-stages/:id', isAuthenticated, async (req, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const updatedStage = await storage.updateWorkflowStage(stageId, req.body);
      res.json(updatedStage);
    } catch (error) {
      console.error("Error updating workflow stage:", error);
      res.status(500).json({ message: "Failed to update workflow stage" });
    }
  });

  // User management
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin, supervisor, or approver role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      const hasPermission = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      if (!hasPermission) {
        return res.status(403).json({ message: "Only admins, supervisors, or approvers can create users" });
      }

      const { 
        email, 
        firstName, 
        lastName, 
        roles, 
        phone, 
        mobileNumber, 
        whatsappNumber, 
        enableSmsNotifications, 
        enableWhatsappNotifications 
      } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ 
          message: "Missing required fields: email, firstName, lastName, and roles are required" 
        });
      }

      console.log("Creating user with data:", {
        email, firstName, lastName, roles, phone, mobileNumber, whatsappNumber, 
        enableSmsNotifications, enableWhatsappNotifications
      });
      
      // Check if user already exists by email (including inactive users)
      try {
        // First check active users
        const activeUsers = await storage.getAllUsers();
        const activeUser = activeUsers.find(user => user.email === email);
        
        if (activeUser) {
          return res.status(400).json({ 
            message: `User with email ${email} already exists (active)`,
            suggestion: "This user already has an active account. You can update their profile instead of creating a new one."
          });
        }
        
        // Then check all users including inactive ones using direct query
        const allUsers = await db.select().from(users).where(eq(users.email, email));
        if (allUsers.length > 0) {
          const existingUser = allUsers[0];
          return res.status(400).json({ 
            message: `User with email ${email} already exists (inactive)`,
            suggestion: "This user profile exists but is inactive. They need to log in via Replit Auth to activate their account, then you can update their profile."
          });
        }
      } catch (emailCheckError) {
        console.error("Error checking existing users:", emailCheckError);
        // Continue with user creation if email check fails
      }
      
      // Generate a temporary user ID (this would normally be handled by the auth provider)
      const userId = `pending_${Date.now()}`;
      
      const newUser = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        roles: JSON.stringify(roles),
        phone: phone || null,
        mobileNumber: mobileNumber || null,
        whatsappNumber: whatsappNumber || null,
        enableSmsNotifications: enableSmsNotifications !== undefined ? enableSmsNotifications : true,
        enableWhatsappNotifications: enableWhatsappNotifications !== undefined ? enableWhatsappNotifications : true,
        isActive: false, // Mark as inactive until they log in via Replit Auth
      });

      // Create audit entry for user creation
      await storage.createAuditEntry({
        action: 'user_profile_created',
        newValue: `${firstName} ${lastName} (${email}) - ${roles.join(', ')}`,
        userId: req.user.claims.sub,
        reason: `User profile created for ${email} with roles ${roles.join(', ')}. Account pending activation via Replit Auth login.`
      });

      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      console.error("Request body:", req.body);
      res.status(500).json({ 
        message: "Failed to create user", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Update user
  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin, supervisor, or approver role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      const hasPermission = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      if (!hasPermission) {
        return res.status(403).json({ message: "Only admins, supervisors, or approvers can update users" });
      }

      const userId = req.params.id;
      const updateData = req.body;
      
      // Get the user being updated for audit trail
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Create audit entry for user update
      await storage.createAuditEntry({
        action: 'user_updated',
        previousValue: JSON.stringify(userToUpdate),
        newValue: JSON.stringify(updatedUser),
        userId: req.user.claims.sub,
        reason: `User ${userToUpdate.email} details updated`
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can delete users" });
      }

      const userId = req.params.id;
      
      // Get the user being deleted for audit trail
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // Mark user as inactive instead of hard delete for auth integrity
      await storage.updateUser(userId, {
        isActive: false,
        firstName: `[DELETED] ${userToDelete.firstName}`,
        lastName: userToDelete.lastName,
        email: `deleted_${Date.now()}_${userToDelete.email}`,
        roles: JSON.stringify([]),
      });
      
      // Create audit entry for user deletion
      await storage.createAuditEntry({
        action: 'user_deleted',
        previousValue: `${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`,
        userId: req.user.claims.sub,
        reason: `User ${userToDelete.email} deleted from system. Account deactivated and marked as deleted.`
      });

      res.json({ 
        message: "User deleted successfully",
        note: "User account has been deactivated and will no longer have access to the system."
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put('/api/users/:id/roles', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can update user roles" });
      }

      const userId = req.params.id;
      const { roles } = req.body;
      
      // Get the user being updated for audit trail
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUserRoles(userId, roles);
      
      // Create audit entry for role change
      const previousRoles = typeof userToUpdate.roles === 'string' ? JSON.parse(userToUpdate.roles) : userToUpdate.roles;
      await storage.createAuditEntry({
        action: 'roles_changed',
        previousValue: previousRoles.join(', '),
        newValue: roles.join(', '),
        userId: req.user.claims.sub,
        reason: `User ${userToUpdate.email} roles changed from ${previousRoles.join(', ')} to ${roles.join(', ')}`
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Audit trail
  app.get('/api/audit-trail', isAuthenticated, async (req, res) => {
    try {
      const complaintId = req.query.complaintId ? parseInt(req.query.complaintId as string) : undefined;
      const auditEntries = await storage.getAuditTrail(complaintId);
      res.json(auditEntries);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Initialize default roles if none exist
  app.post('/api/roles/seed', isAuthenticated, async (req, res) => {
    try {
      const existingRoles = await storage.getRoles();
      if (existingRoles.length > 0) {
        return res.json({ message: 'Roles already exist', count: existingRoles.length });
      }

      const defaultRoles = [
        {
          name: 'field_staff',
          displayName: 'Field Staff',
          description: 'Field inspection staff responsible for on-site complaint investigation',
          permissions: ['create_complaints', 'edit_complaints', 'view_audit_trail'],
          isActive: true
        },
        {
          name: 'contract_staff',
          displayName: 'Contract Staff',
          description: 'Contract workers handling specific complaint types',
          permissions: ['create_complaints', 'edit_complaints'],
          isActive: true
        },
        {
          name: 'supervisor',
          displayName: 'Supervisor',
          description: 'Supervisory staff overseeing complaint processing and workflow',
          permissions: ['create_complaints', 'edit_complaints', 'manage_workflow', 'view_audit_trail', 'send_notifications'],
          isActive: true
        },
        {
          name: 'approver',
          displayName: 'Approver',
          description: 'Senior staff with approval authority for complaint resolutions',
          permissions: ['create_complaints', 'edit_complaints', 'manage_workflow', 'view_audit_trail', 'send_notifications'],
          isActive: true
        },
        {
          name: 'admin',
          displayName: 'Administrator',
          description: 'System administrators with full access to all features',
          permissions: ['create_complaints', 'edit_complaints', 'delete_complaints', 'manage_users', 'manage_roles', 'view_audit_trail', 'send_notifications', 'manage_workflow'],
          isActive: true
        }
      ];

      const createdRoles = [];
      for (const role of defaultRoles) {
        console.log('Creating role:', role);
        try {
          const createdRole = await storage.createRole(role);
          console.log('Created role successfully:', createdRole);
          createdRoles.push(createdRole);
        } catch (error) {
          console.error('Error creating individual role:', error);
          throw error;
        }
      }

      res.json({ message: 'Default roles created successfully', roles: createdRoles });
    } catch (error) {
      console.error('Error seeding roles:', error);
      res.status(500).json({ error: 'Failed to seed roles' });
    }
  });

  // Role management routes
  app.get('/api/roles', isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', isAuthenticated, async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.json(role);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  });

  app.put('/api/roles/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.updateRole(id, req.body);
      res.json(role);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  app.delete('/api/roles/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRole(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Failed to delete role' });
    }
  });

  // Update role permissions through Role-Action Mappings
  app.put('/api/roles/:roleName/permissions', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can update role permissions" });
      }

      const roleName = req.params.roleName;
      const { permissions } = req.body;
      
      // Find the role by name
      const roles = await storage.getRoles();
      const role = roles.find(r => r.name === roleName);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Get all existing role-action mappings for this role
      const existingMappings = await storage.getRoleActionMappingsByRole(roleName);
      
      // Track changes for audit trail
      const changes = [];
      
      // Update each mapping based on the new permissions
      for (const mapping of existingMappings) {
        const shouldHavePermission = permissions.includes(mapping.actionId);
        const currentlyHasPermission = mapping.hasPermission;
        
        if (shouldHavePermission !== currentlyHasPermission) {
          // Update the mapping
          await storage.updateRoleActionMapping(mapping.id, {
            hasPermission: shouldHavePermission
          });
          
          changes.push({
            action: mapping.actionId,
            actionName: mapping.actionName,
            from: currentlyHasPermission,
            to: shouldHavePermission
          });
        }
      }
      
      // Create audit entry for permission changes
      if (changes.length > 0) {
        await storage.createAuditEntry({
          action: 'role_action_mappings_updated',
          previousValue: JSON.stringify(changes.map(c => ({ action: c.action, permission: c.from }))),
          newValue: JSON.stringify(changes.map(c => ({ action: c.action, permission: c.to }))),
          userId: req.user.claims.sub,
          reason: `Role ${roleName} action permissions updated: ${changes.length} changes made`
        });
      }

      res.json({ 
        success: true, 
        message: `Updated ${changes.length} permissions for role ${roleName}`,
        changes: changes 
      });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      res.status(500).json({ error: 'Failed to update role permissions' });
    }
  });

  // Role-Action Mapping routes
  app.get('/api/role-action-mappings', isAuthenticated, async (req, res) => {
    try {
      const mappings = await storage.getRoleActionMappings();
      res.json(mappings);
    } catch (error) {
      console.error('Error fetching role-action mappings:', error);
      res.status(500).json({ error: 'Failed to fetch role-action mappings' });
    }
  });

  app.post('/api/role-action-mappings', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can create role-action mappings" });
      }

      const mapping = await storage.createRoleActionMapping(req.body);
      res.json(mapping);
    } catch (error) {
      console.error('Error creating role-action mapping:', error);
      res.status(500).json({ error: 'Failed to create role-action mapping' });
    }
  });

  app.put('/api/role-action-mappings/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can update role-action mappings" });
      }

      const id = parseInt(req.params.id);
      const mapping = await storage.updateRoleActionMapping(id, req.body);
      res.json(mapping);
    } catch (error) {
      console.error('Error updating role-action mapping:', error);
      res.status(500).json({ error: 'Failed to update role-action mapping' });
    }
  });

  app.delete('/api/role-action-mappings/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can delete role-action mappings" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteRoleActionMapping(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting role-action mapping:', error);
      res.status(500).json({ error: 'Failed to delete role-action mapping' });
    }
  });

  // Get roles for a specific action
  app.get('/api/role-action-mappings/action/:actionId/roles', isAuthenticated, async (req, res) => {
    try {
      const actionId = req.params.actionId;
      const roles = await storage.getRolesForAction(actionId);
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles for action:', error);
      res.status(500).json({ error: 'Failed to fetch roles for action' });
    }
  });

  // Get mappings for a specific role
  app.get('/api/role-action-mappings/role/:roleName', isAuthenticated, async (req, res) => {
    try {
      const roleName = req.params.roleName;
      const mappings = await storage.getRoleActionMappingsByRole(roleName);
      res.json(mappings);
    } catch (error) {
      console.error('Error fetching mappings for role:', error);
      res.status(500).json({ error: 'Failed to fetch mappings for role' });
    }
  });

  // Seed role-action mappings from static definitions
  app.post('/api/role-action-mappings/seed', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const userRoles = typeof currentUser.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser.roles;
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: "Only admins can seed role-action mappings" });
      }

      // Define the role-action mappings from the static file
      const roleActionMappings = [
        // Application Management
        { actionId: "user_management", actionName: "User Management", category: "Application Management", 
          description: "Create, edit, and delete user accounts", roleName: "admin", hasPermission: true },
        { actionId: "user_management", actionName: "User Management", category: "Application Management", 
          description: "Create, edit, and delete user accounts", roleName: "supervisor", hasPermission: true },
        { actionId: "user_management", actionName: "User Management", category: "Application Management", 
          description: "Create, edit, and delete user accounts", roleName: "approver", hasPermission: false },
        { actionId: "user_management", actionName: "User Management", category: "Application Management", 
          description: "Create, edit, and delete user accounts", roleName: "field_staff", hasPermission: false },
        { actionId: "user_management", actionName: "User Management", category: "Application Management", 
          description: "Create, edit, and delete user accounts", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "role_management", actionName: "Role Management", category: "Application Management", 
          description: "Manage system roles and permissions", roleName: "admin", hasPermission: true },
        { actionId: "role_management", actionName: "Role Management", category: "Application Management", 
          description: "Manage system roles and permissions", roleName: "supervisor", hasPermission: false },
        { actionId: "role_management", actionName: "Role Management", category: "Application Management", 
          description: "Manage system roles and permissions", roleName: "approver", hasPermission: false },
        { actionId: "role_management", actionName: "Role Management", category: "Application Management", 
          description: "Manage system roles and permissions", roleName: "field_staff", hasPermission: false },
        { actionId: "role_management", actionName: "Role Management", category: "Application Management", 
          description: "Manage system roles and permissions", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "workflow_designer", actionName: "Workflow Designer", category: "Application Management", 
          description: "Create and modify workflow templates", roleName: "admin", hasPermission: true },
        { actionId: "workflow_designer", actionName: "Workflow Designer", category: "Application Management", 
          description: "Create and modify workflow templates", roleName: "supervisor", hasPermission: true },
        { actionId: "workflow_designer", actionName: "Workflow Designer", category: "Application Management", 
          description: "Create and modify workflow templates", roleName: "approver", hasPermission: false },
        { actionId: "workflow_designer", actionName: "Workflow Designer", category: "Application Management", 
          description: "Create and modify workflow templates", roleName: "field_staff", hasPermission: false },
        { actionId: "workflow_designer", actionName: "Workflow Designer", category: "Application Management", 
          description: "Create and modify workflow templates", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "list_values", actionName: "List Values Management", category: "Application Management", 
          description: "Manage system configuration values", roleName: "admin", hasPermission: true },
        { actionId: "list_values", actionName: "List Values Management", category: "Application Management", 
          description: "Manage system configuration values", roleName: "supervisor", hasPermission: false },
        { actionId: "list_values", actionName: "List Values Management", category: "Application Management", 
          description: "Manage system configuration values", roleName: "approver", hasPermission: false },
        { actionId: "list_values", actionName: "List Values Management", category: "Application Management", 
          description: "Manage system configuration values", roleName: "field_staff", hasPermission: false },
        { actionId: "list_values", actionName: "List Values Management", category: "Application Management", 
          description: "Manage system configuration values", roleName: "contract_staff", hasPermission: false },
        
        // Workflow Tasks
        { actionId: "initial_inspection", actionName: "Initial Inspection", category: "Workflow Tasks", 
          description: "Perform field inspections of complaints", roleName: "admin", hasPermission: true },
        { actionId: "initial_inspection", actionName: "Initial Inspection", category: "Workflow Tasks", 
          description: "Perform field inspections of complaints", roleName: "supervisor", hasPermission: false },
        { actionId: "initial_inspection", actionName: "Initial Inspection", category: "Workflow Tasks", 
          description: "Perform field inspections of complaints", roleName: "approver", hasPermission: false },
        { actionId: "initial_inspection", actionName: "Initial Inspection", category: "Workflow Tasks", 
          description: "Perform field inspections of complaints", roleName: "field_staff", hasPermission: false },
        { actionId: "initial_inspection", actionName: "Initial Inspection", category: "Workflow Tasks", 
          description: "Perform field inspections of complaints", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "safety_inspection", actionName: "Safety Inspection", category: "Workflow Tasks", 
          description: "Conduct safety-related inspections", roleName: "admin", hasPermission: false },
        { actionId: "safety_inspection", actionName: "Safety Inspection", category: "Workflow Tasks", 
          description: "Conduct safety-related inspections", roleName: "supervisor", hasPermission: false },
        { actionId: "safety_inspection", actionName: "Safety Inspection", category: "Workflow Tasks", 
          description: "Conduct safety-related inspections", roleName: "approver", hasPermission: false },
        { actionId: "safety_inspection", actionName: "Safety Inspection", category: "Workflow Tasks", 
          description: "Conduct safety-related inspections", roleName: "field_staff", hasPermission: true },
        { actionId: "safety_inspection", actionName: "Safety Inspection", category: "Workflow Tasks", 
          description: "Conduct safety-related inspections", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "assessment", actionName: "Assessment", category: "Workflow Tasks", 
          description: "Review and assess complaint validity", roleName: "admin", hasPermission: false },
        { actionId: "assessment", actionName: "Assessment", category: "Workflow Tasks", 
          description: "Review and assess complaint validity", roleName: "supervisor", hasPermission: true },
        { actionId: "assessment", actionName: "Assessment", category: "Workflow Tasks", 
          description: "Review and assess complaint validity", roleName: "approver", hasPermission: false },
        { actionId: "assessment", actionName: "Assessment", category: "Workflow Tasks", 
          description: "Review and assess complaint validity", roleName: "field_staff", hasPermission: false },
        { actionId: "assessment", actionName: "Assessment", category: "Workflow Tasks", 
          description: "Review and assess complaint validity", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "enforcement_action", actionName: "Enforcement Action", category: "Workflow Tasks", 
          description: "Take enforcement actions on violations", roleName: "admin", hasPermission: true },
        { actionId: "enforcement_action", actionName: "Enforcement Action", category: "Workflow Tasks", 
          description: "Take enforcement actions on violations", roleName: "supervisor", hasPermission: true },
        { actionId: "enforcement_action", actionName: "Enforcement Action", category: "Workflow Tasks", 
          description: "Take enforcement actions on violations", roleName: "approver", hasPermission: false },
        { actionId: "enforcement_action", actionName: "Enforcement Action", category: "Workflow Tasks", 
          description: "Take enforcement actions on violations", roleName: "field_staff", hasPermission: false },
        { actionId: "enforcement_action", actionName: "Enforcement Action", category: "Workflow Tasks", 
          description: "Take enforcement actions on violations", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "resolution", actionName: "Resolution", category: "Workflow Tasks", 
          description: "Close and resolve complaints", roleName: "admin", hasPermission: false },
        { actionId: "resolution", actionName: "Resolution", category: "Workflow Tasks", 
          description: "Close and resolve complaints", roleName: "supervisor", hasPermission: false },
        { actionId: "resolution", actionName: "Resolution", category: "Workflow Tasks", 
          description: "Close and resolve complaints", roleName: "approver", hasPermission: true },
        { actionId: "resolution", actionName: "Resolution", category: "Workflow Tasks", 
          description: "Close and resolve complaints", roleName: "field_staff", hasPermission: true },
        { actionId: "resolution", actionName: "Resolution", category: "Workflow Tasks", 
          description: "Close and resolve complaints", roleName: "contract_staff", hasPermission: false },
        
        { actionId: "reject_demolition", actionName: "Reject Demolition", category: "Workflow Tasks", 
          description: "Reject demolition permit applications", roleName: "admin", hasPermission: true },
        { actionId: "reject_demolition", actionName: "Reject Demolition", category: "Workflow Tasks", 
          description: "Reject demolition permit applications", roleName: "supervisor", hasPermission: true },
        { actionId: "reject_demolition", actionName: "Reject Demolition", category: "Workflow Tasks", 
          description: "Reject demolition permit applications", roleName: "approver", hasPermission: false },
        { actionId: "reject_demolition", actionName: "Reject Demolition", category: "Workflow Tasks", 
          description: "Reject demolition permit applications", roleName: "field_staff", hasPermission: false },
        { actionId: "reject_demolition", actionName: "Reject Demolition", category: "Workflow Tasks", 
          description: "Reject demolition permit applications", roleName: "contract_staff", hasPermission: false },
      ];

      // Create all mappings
      const createdMappings = [];
      for (const mapping of roleActionMappings) {
        const created = await storage.createRoleActionMapping(mapping);
        createdMappings.push(created);
      }

      // Create audit entry
      await storage.createAuditEntry({
        action: 'role_action_mappings_seeded',
        userId: req.user.claims.sub,
        reason: `Seeded ${createdMappings.length} role-action mappings from static definitions`
      });

      res.json({ 
        success: true, 
        message: `Successfully seeded ${createdMappings.length} role-action mappings`,
        mappings: createdMappings 
      });
    } catch (error) {
      console.error('Error seeding role-action mappings:', error);
      res.status(500).json({ error: 'Failed to seed role-action mappings' });
    }
  });

  // List Values routes
  app.get('/api/list-values', isAuthenticated, async (req, res) => {
    try {
      const listValues = await storage.getListValues();
      res.json(listValues);
    } catch (error) {
      console.error('Error fetching list values:', error);
      res.status(500).json({ error: 'Failed to fetch list values' });
    }
  });

  app.post('/api/list-values', isAuthenticated, async (req, res) => {
    try {
      console.log('Creating list value with data:', req.body);
      console.log('Data types:', {
        listValueType: typeof req.body.listValueType,
        listValueCode: typeof req.body.listValueCode,
        listValueDescr: typeof req.body.listValueDescr,
        order: typeof req.body.order,
        listValue: typeof req.body.listValue,
        isActive: typeof req.body.isActive
      });
      
      // Clean the data to ensure proper types
      const cleanData = {
        listValueType: req.body.listValueType,
        listValueCode: req.body.listValueCode,
        listValueDescr: req.body.listValueDescr,
        order: parseInt(req.body.order) || 0,
        listValue: req.body.listValue,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };
      
      console.log('Cleaned data:', cleanData);
      
      const listValue = await storage.createListValue(cleanData);
      console.log('Created list value:', listValue);
      res.json(listValue);
    } catch (error) {
      console.error('Detailed error creating list value:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: 'Failed to create list value',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  });

  app.put('/api/list-values/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listValue = await storage.updateListValue(id, req.body);
      res.json(listValue);
    } catch (error) {
      console.error('Error updating list value:', error);
      res.status(500).json({ error: 'Failed to update list value' });
    }
  });

  app.delete('/api/list-values/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteListValue(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting list value:', error);
      res.status(500).json({ error: 'Failed to delete list value' });
    }
  });

  // Timesheet routes
  app.get('/api/timesheets', isAuthenticated, async (req, res) => {
    try {
      const { userId, dateFrom, dateTo } = req.query;
      const timesheets = await storage.getTimesheets(
        userId as string,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );
      res.json(timesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      res.status(500).json({ error: 'Failed to fetch timesheets' });
    }
  });

  app.post('/api/timesheets', isAuthenticated, async (req, res) => {
    try {
      // Validate Business Work ID if provided
      if (req.body.businessWorkId) {
        const complaint = await storage.getComplaintByComplaintId(req.body.businessWorkId);
        if (!complaint) {
          return res.status(400).json({ error: 'Invalid Business Work ID / Complaint ID. Please enter a valid complaint number.' });
        }
      }
      
      const timesheet = await storage.createTimesheet(req.body);
      res.json(timesheet);
    } catch (error) {
      console.error('Error creating timesheet:', error);
      res.status(500).json({ error: 'Failed to create timesheet' });
    }
  });

  app.put('/api/timesheets/:id', isAuthenticated, async (req, res) => {
    try {
      // Validate Business Work ID if provided
      if (req.body.businessWorkId) {
        const complaint = await storage.getComplaintByComplaintId(req.body.businessWorkId);
        if (!complaint) {
          return res.status(400).json({ error: 'Invalid Business Work ID / Complaint ID. Please enter a valid complaint number.' });
        }
      }
      
      const id = parseInt(req.params.id);
      const timesheet = await storage.updateTimesheet(id, req.body);
      res.json(timesheet);
    } catch (error) {
      console.error('Error updating timesheet:', error);
      res.status(500).json({ error: 'Failed to update timesheet' });
    }
  });

  app.delete('/api/timesheets/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimesheet(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      res.status(500).json({ error: 'Failed to delete timesheet' });
    }
  });

  app.get('/api/timesheet-activities', isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getTimesheetActivities();
      res.json(activities);
    } catch (error) {
      console.error('Error fetching timesheet activities:', error);
      res.status(500).json({ error: 'Failed to fetch timesheet activities' });
    }
  });

  app.get('/api/valid-complaint-ids', isAuthenticated, async (req, res) => {
    try {
      const complaints = await storage.getComplaints();
      const complaintIds = complaints.map(complaint => complaint.complaintId);
      res.json(complaintIds);
    } catch (error) {
      console.error('Error fetching valid complaint IDs:', error);
      res.status(500).json({ error: 'Failed to fetch valid complaint IDs' });
    }
  });

  // Leave Request Routes
  app.get('/api/leave-requests', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, status } = req.query;
      const currentUserId = req.user.claims.sub;
      
      // Users can only see their own requests unless they have supervisor/admin role
      const currentUser = await storage.getUser(currentUserId);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canViewAll = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      const queryUserId = canViewAll ? userId : currentUserId;
      const requests = await storage.getLeaveRequests(queryUserId, status);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
  });

  app.post('/api/leave-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = { ...req.body, userId, status: 'pending' };
      
      const request = await storage.createLeaveRequest(requestData);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'leave_request_created',
        newValue: `Leave request from ${requestData.startDate} to ${requestData.endDate} (${requestData.leaveType})`,
        userId,
        reason: `Leave request submitted: ${requestData.reason || 'No reason provided'}`
      });
      
      res.json(request);
    } catch (error) {
      console.error('Error creating leave request:', error);
      res.status(500).json({ error: 'Failed to create leave request' });
    }
  });

  app.put('/api/leave-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      const existingRequest = await storage.getLeaveRequestById(id);
      if (!existingRequest) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      
      // Only allow updates by the request owner or supervisors
      const currentUser = await storage.getUser(userId);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canUpdate = existingRequest.userId === userId || userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canUpdate) {
        return res.status(403).json({ error: 'Not authorized to update this request' });
      }
      
      const updatedRequest = await storage.updateLeaveRequest(id, updateData);
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating leave request:', error);
      res.status(500).json({ error: 'Failed to update leave request' });
    }
  });

  app.delete('/api/leave-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingRequest = await storage.getLeaveRequestById(id);
      if (!existingRequest) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      
      // Only allow deletion by the request owner
      if (existingRequest.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this request' });
      }
      
      await storage.deleteLeaveRequest(id);
      res.json({ message: 'Leave request deleted successfully' });
    } catch (error) {
      console.error('Error deleting leave request:', error);
      res.status(500).json({ error: 'Failed to delete leave request' });
    }
  });

  app.post('/api/leave-requests/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = req.user.claims.sub;
      
      // Check if user has approval authority
      const currentUser = await storage.getUser(approvedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canApprove = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canApprove) {
        return res.status(403).json({ error: 'Not authorized to approve leave requests' });
      }
      
      const approvedRequest = await storage.approveLeaveRequest(id, approvedBy);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'leave_request_approved',
        newValue: `Leave request approved by ${currentUser?.firstName} ${currentUser?.lastName}`,
        userId: approvedBy,
        reason: 'Leave request approved'
      });
      
      res.json(approvedRequest);
    } catch (error) {
      console.error('Error approving leave request:', error);
      res.status(500).json({ error: 'Failed to approve leave request' });
    }
  });

  app.post('/api/leave-requests/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = req.user.claims.sub;
      const { reason } = req.body;
      
      // Check if user has approval authority
      const currentUser = await storage.getUser(approvedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canApprove = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canApprove) {
        return res.status(403).json({ error: 'Not authorized to reject leave requests' });
      }
      
      const rejectedRequest = await storage.rejectLeaveRequest(id, approvedBy, reason);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'leave_request_rejected',
        newValue: `Leave request rejected by ${currentUser?.firstName} ${currentUser?.lastName}`,
        userId: approvedBy,
        reason: reason || 'Leave request rejected'
      });
      
      res.json(rejectedRequest);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ error: 'Failed to reject leave request' });
    }
  });

  // Overtime Request Routes
  app.get('/api/overtime-requests', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, status } = req.query;
      const currentUserId = req.user.claims.sub;
      
      // Users can only see their own requests unless they have supervisor/admin role
      const currentUser = await storage.getUser(currentUserId);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canViewAll = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      const queryUserId = canViewAll ? userId : currentUserId;
      const requests = await storage.getOvertimeRequests(queryUserId, status);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching overtime requests:', error);
      res.status(500).json({ error: 'Failed to fetch overtime requests' });
    }
  });

  app.post('/api/overtime-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = { ...req.body, userId, status: 'pending' };
      
      const request = await storage.createOvertimeRequest(requestData);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'overtime_request_created',
        newValue: `Overtime request for ${requestData.date} (${requestData.hours} hours)`,
        userId,
        reason: `Overtime request submitted: ${requestData.reason || 'No reason provided'}`
      });
      
      res.json(request);
    } catch (error) {
      console.error('Error creating overtime request:', error);
      res.status(500).json({ error: 'Failed to create overtime request' });
    }
  });

  app.put('/api/overtime-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      const existingRequest = await storage.getOvertimeRequestById(id);
      if (!existingRequest) {
        return res.status(404).json({ error: 'Overtime request not found' });
      }
      
      // Only allow updates by the request owner or supervisors
      const currentUser = await storage.getUser(userId);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canUpdate = existingRequest.userId === userId || userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canUpdate) {
        return res.status(403).json({ error: 'Not authorized to update this request' });
      }
      
      const updatedRequest = await storage.updateOvertimeRequest(id, updateData);
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating overtime request:', error);
      res.status(500).json({ error: 'Failed to update overtime request' });
    }
  });

  app.delete('/api/overtime-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingRequest = await storage.getOvertimeRequestById(id);
      if (!existingRequest) {
        return res.status(404).json({ error: 'Overtime request not found' });
      }
      
      // Only allow deletion by the request owner
      if (existingRequest.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this request' });
      }
      
      await storage.deleteOvertimeRequest(id);
      res.json({ message: 'Overtime request deleted successfully' });
    } catch (error) {
      console.error('Error deleting overtime request:', error);
      res.status(500).json({ error: 'Failed to delete overtime request' });
    }
  });

  app.post('/api/overtime-requests/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = req.user.claims.sub;
      
      // Check if user has approval authority
      const currentUser = await storage.getUser(approvedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canApprove = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canApprove) {
        return res.status(403).json({ error: 'Not authorized to approve overtime requests' });
      }
      
      const approvedRequest = await storage.approveOvertimeRequest(id, approvedBy);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'overtime_request_approved',
        newValue: `Overtime request approved by ${currentUser?.firstName} ${currentUser?.lastName}`,
        userId: approvedBy,
        reason: 'Overtime request approved'
      });
      
      res.json(approvedRequest);
    } catch (error) {
      console.error('Error approving overtime request:', error);
      res.status(500).json({ error: 'Failed to approve overtime request' });
    }
  });

  app.post('/api/overtime-requests/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = req.user.claims.sub;
      const { reason } = req.body;
      
      // Check if user has approval authority
      const currentUser = await storage.getUser(approvedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canApprove = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canApprove) {
        return res.status(403).json({ error: 'Not authorized to reject overtime requests' });
      }
      
      const rejectedRequest = await storage.rejectOvertimeRequest(id, approvedBy, reason);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'overtime_request_rejected',
        newValue: `Overtime request rejected by ${currentUser?.firstName} ${currentUser?.lastName}`,
        userId: approvedBy,
        reason: reason || 'Overtime request rejected'
      });
      
      res.json(rejectedRequest);
    } catch (error) {
      console.error('Error rejecting overtime request:', error);
      res.status(500).json({ error: 'Failed to reject overtime request' });
    }
  });

  // Forwarding endpoints
  app.post('/api/complaints/:id/forward', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const forwardedBy = req.user.claims.sub;
      const { forwardTo, comments } = req.body;
      
      // Get the target user
      const targetUser = await storage.getUserByEmail?.(forwardTo);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      
      // Update complaint assignment
      const updatedComplaint = await storage.updateComplaint(complaintId, { 
        assignedTo: targetUser.id 
      });
      
      // Create audit entry
      const currentUser = await storage.getUser(forwardedBy);
      await storage.createAuditEntry({
        complaintId,
        action: 'complaint_forwarded',
        newValue: `Complaint forwarded to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`,
        userId: forwardedBy,
        reason: comments || 'Complaint forwarded'
      });
      
      res.json(updatedComplaint);
    } catch (error) {
      console.error('Error forwarding complaint:', error);
      res.status(500).json({ error: 'Failed to forward complaint' });
    }
  });

  app.post('/api/leave-requests/:id/forward', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const forwardedBy = req.user.claims.sub;
      const { forwardTo, comments } = req.body;
      
      // Get the target user
      const targetUser = await storage.getUserByEmail?.(forwardTo);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      
      // Create audit entry for forwarding
      const currentUser = await storage.getUser(forwardedBy);
      await storage.createAuditEntry({
        action: 'leave_request_forwarded',
        newValue: `Leave request forwarded to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`,
        userId: forwardedBy,
        reason: comments || 'Leave request forwarded'
      });
      
      res.json({ message: 'Leave request forwarded successfully' });
    } catch (error) {
      console.error('Error forwarding leave request:', error);
      res.status(500).json({ error: 'Failed to forward leave request' });
    }
  });

  app.post('/api/overtime-requests/:id/forward', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const forwardedBy = req.user.claims.sub;
      const { forwardTo, comments } = req.body;
      
      // Get the target user
      const targetUser = await storage.getUserByEmail?.(forwardTo);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      
      // Create audit entry for forwarding
      const currentUser = await storage.getUser(forwardedBy);
      await storage.createAuditEntry({
        action: 'overtime_request_forwarded',
        newValue: `Overtime request forwarded to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`,
        userId: forwardedBy,
        reason: comments || 'Overtime request forwarded'
      });
      
      res.json({ message: 'Overtime request forwarded successfully' });
    } catch (error) {
      console.error('Error forwarding overtime request:', error);
      res.status(500).json({ error: 'Failed to forward overtime request' });
    }
  });

  // Workflow routes
  app.get('/api/workflows', isAuthenticated, async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.post('/api/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workflowData = {
        ...req.body,
        createdBy: userId,
      };
      const workflow = await storage.createWorkflow(workflowData);
      res.json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put('/api/workflows/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.updateWorkflow(id, req.body);
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete('/api/workflows/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkflow(id);
      res.json({ message: "Workflow deleted successfully" });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Workflow template routes
  app.get('/api/workflow-templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getWorkflowTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching workflow templates:", error);
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  app.get('/api/workflow-templates/:complaintType', isAuthenticated, async (req, res) => {
    try {
      const { complaintType } = req.params;
      const template = await storage.getTemplateForComplaintType(complaintType);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching template for complaint type:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/workflow-templates/:workflowId/:complaintType', isAuthenticated, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      const { complaintType } = req.params;
      
      const template = await storage.setTemplateForComplaintType(workflowId, complaintType);
      res.json(template);
    } catch (error) {
      console.error("Error setting workflow template:", error);
      res.status(500).json({ message: "Failed to set workflow template" });
    }
  });

  app.post('/api/complaints/:id/assign-workflow', isAuthenticated, async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const { workflowId } = req.body;
      
      await storage.assignWorkflowToComplaint(complaintId, workflowId);
      res.json({ message: "Workflow assigned successfully" });
    } catch (error) {
      console.error("Error assigning workflow to complaint:", error);
      res.status(500).json({ message: "Failed to assign workflow" });
    }
  });

  // Manual workflow task creation for fixing missing tasks
  app.post('/api/complaints/:id/create-workflow-tasks', isAuthenticated, async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const { workflowId } = req.body;
      
      // Get complaint details first
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      // Create workflow tasks from workflow template
      const tasks = await storage.createWorkflowTasksFromWorkflow(complaintId, workflowId || complaint.workflowId);
      
      // Create inbox items for each task
      for (const task of tasks) {
        await storage.createInboxItem({
          userId: task.assignedTo,
          itemType: 'WORKFLOW_TASK',
          title: `New Task: ${task.taskName}`,
          description: `${task.taskType.replace(/_/g, ' ')} for complaint ${complaint.complaintId}`,
          priority: task.priority,
          workflowTaskId: task.id,
          complaintId: complaint.id,
          isRead: false
        });
      }
      
      // Create audit entry
      await storage.createAuditEntry({
        complaintId: complaint.id,
        action: 'workflow_tasks_created',
        newValue: `${tasks.length} workflow tasks created manually for complaint ${complaint.complaintId}`,
        userId: req.user.claims.sub,
        reason: 'Manual workflow task creation'
      });
      
      res.json({ message: "Workflow tasks created successfully", tasks });
    } catch (error) {
      console.error("Error creating workflow tasks:", error);
      res.status(500).json({ message: "Failed to create workflow tasks" });
    }
  });

  app.get('/api/workflows/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getWorkflowById(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  // Workflow task routes
  app.get('/api/workflow-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { assignedTo, complaintId, status, taskType } = req.query;
      const filters: any = {};
      
      if (assignedTo) filters.assignedTo = assignedTo;
      if (complaintId) filters.complaintId = parseInt(complaintId);
      if (status) filters.status = status;
      if (taskType) filters.taskType = taskType;
      
      const tasks = await storage.getWorkflowTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching workflow tasks:', error);
      res.status(500).json({ error: 'Failed to fetch workflow tasks' });
    }
  });

  app.post('/api/workflow-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.createWorkflowTask(req.body);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'workflow_task_created',
        newValue: `Workflow task "${task.taskName}" created and assigned to ${task.assignedTo}`,
        userId: req.user.claims.sub,
        reason: 'Workflow task created'
      });
      
      res.json(task);
    } catch (error) {
      console.error('Error creating workflow task:', error);
      res.status(500).json({ error: 'Failed to create workflow task' });
    }
  });

  app.put('/api/workflow-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Get current task for audit trail
      const currentTask = await storage.getWorkflowTaskById(id);
      if (!currentTask) {
        return res.status(404).json({ error: 'Workflow task not found' });
      }
      
      const updatedTask = await storage.updateWorkflowTask(id, updates);
      
      // Create audit entry for significant changes
      if (updates.status || updates.observations || updates.inspectionStatus) {
        await storage.createAuditEntry({
          action: 'workflow_task_updated',
          previousValue: currentTask.status,
          newValue: updates.status || currentTask.status,
          userId: req.user.claims.sub,
          reason: `Workflow task updated: ${JSON.stringify(updates)}`
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating workflow task:', error);
      res.status(500).json({ error: 'Failed to update workflow task' });
    }
  });

  app.post('/api/workflow-tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { completionNotes } = req.body;
      const completedBy = req.user.claims.sub;
      
      const completedTask = await storage.completeWorkflowTask(id, completedBy, completionNotes);
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'workflow_task_completed',
        newValue: `Workflow task "${completedTask.taskName}" completed`,
        userId: completedBy,
        reason: completionNotes || 'Workflow task completed'
      });
      
      res.json(completedTask);
    } catch (error) {
      console.error('Error completing workflow task:', error);
      res.status(500).json({ error: 'Failed to complete workflow task' });
    }
  });

  app.get('/api/workflow-tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getWorkflowTaskById(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Workflow task not found' });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Error fetching workflow task:', error);
      res.status(500).json({ error: 'Failed to fetch workflow task' });
    }
  });

  // Inbox routes
  app.get('/api/inbox', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemType, status, priority, isRead } = req.query;
      
      const filters: any = {};
      if (itemType) filters.itemType = itemType;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (isRead !== undefined) filters.isRead = isRead === 'true';
      
      const items = await storage.getInboxItems(userId, filters);
      res.json(items);
    } catch (error) {
      console.error('Error fetching inbox items:', error);
      res.status(500).json({ error: 'Failed to fetch inbox items' });
    }
  });

  app.post('/api/inbox', isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.createInboxItem(req.body);
      res.json(item);
    } catch (error) {
      console.error('Error creating inbox item:', error);
      res.status(500).json({ error: 'Failed to create inbox item' });
    }
  });

  app.put('/api/inbox/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedItem = await storage.updateInboxItem(id, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating inbox item:', error);
      res.status(500).json({ error: 'Failed to update inbox item' });
    }
  });

  app.post('/api/inbox/:id/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedItem = await storage.markInboxItemAsRead(id);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error marking inbox item as read:', error);
      res.status(500).json({ error: 'Failed to mark inbox item as read' });
    }
  });

  app.post('/api/inbox/:id/mark-unread', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedItem = await storage.markInboxItemAsUnread(id);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error marking inbox item as unread:', error);
      res.status(500).json({ error: 'Failed to mark inbox item as unread' });
    }
  });

  app.get('/api/inbox/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadInboxCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread inbox count:', error);
      res.status(500).json({ error: 'Failed to fetch unread inbox count' });
    }
  });

  // Create workflow tasks from complaint workflow
  app.post('/api/complaints/:id/create-workflow-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      
      // Get complaint to find its workflow
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      
      if (!complaint.workflowId) {
        return res.status(400).json({ error: 'No workflow assigned to complaint' });
      }
      
      console.log(`Creating workflow tasks for complaint ${complaint.complaintId} with workflow ${complaint.workflowId}`);
      const tasks = await storage.createWorkflowTasksFromWorkflow(complaintId, complaint.workflowId);
      console.log(`Created ${tasks.length} workflow tasks`);
      
      // Create inbox items for each task
      for (const task of tasks) {
        await storage.createInboxItem({
          userId: task.assignedTo,
          itemType: 'WORKFLOW_TASK',
          itemId: task.id, // Set the required itemId field
          title: `New Task: ${task.taskName}`,
          description: `${task.taskType.replace(/_/g, ' ')} for complaint ${complaint.complaintId}`,
          priority: task.priority,
          workflowTaskId: task.id,
          complaintId: complaint.id,
          isRead: false
        });
      }
      
      // Create audit entry
      await storage.createAuditEntry({
        action: 'workflow_tasks_created',
        newValue: `${tasks.length} workflow tasks created for complaint ${complaint.complaintId}`,
        userId: req.user.claims.sub,
        complaintId: complaintId,
        reason: 'Workflow tasks created from workflow template'
      });
      
      res.json(tasks);
    } catch (error) {
      console.error('Error creating workflow tasks:', error);
      res.status(500).json({ error: 'Failed to create workflow tasks' });
    }
  });

  // Manual workflow task creation for existing complaints
  app.post('/api/complaints/:complaintId/initialize-workflow', isAuthenticated, async (req: any, res) => {
    try {
      const complaintId = parseInt(req.params.complaintId);
      const userId = req.user.claims.sub;
      
      // Check if user has admin role
      const user = await storage.getUser(userId);
      const userRoles = typeof user?.roles === 'string' ? JSON.parse(user.roles) : user?.roles || [];
      
      if (!userRoles.includes('admin') && !userRoles.includes('supervisor')) {
        return res.status(403).json({ error: 'Admin or supervisor access required' });
      }
      
      // Get the complaint
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      
      // Check if workflow is already assigned
      if (!complaint.workflowId) {
        // Determine complaint type and assign workflow
        let complaintType = 'AIR_QUALITY';
        if (complaint.problemType?.some(p => p.toLowerCase().includes('demolition') || p.toLowerCase().includes('asbestos'))) {
          complaintType = 'DEMOLITION_NOTICE';
        }
        
        const template = await storage.getTemplateForComplaintType(complaintType);
        if (template) {
          await storage.assignWorkflowToComplaint(complaintId, template.id);
          complaint.workflowId = template.id;
        }
      }
      
      // Create workflow tasks if they don't exist
      const existingTasks = await storage.getWorkflowTasks({ complaintId });
      if (existingTasks.length === 0 && complaint.workflowId) {
        const tasks = await storage.createWorkflowTasksFromWorkflow(complaintId, complaint.workflowId);
        
        // Create inbox items for each task
        for (const task of tasks) {
          await storage.createInboxItem({
            userId: task.assignedTo,
            itemType: 'WORKFLOW_TASK',
            itemId: task.id,
            title: `New Task: ${task.taskName}`,
            description: `${task.taskType.replace(/_/g, ' ')} for complaint ${complaint.complaintId}`,
            priority: task.priority,
            workflowTaskId: task.id,
            complaintId: complaint.id,
            isRead: false
          });
        }
        
        // Create audit entry
        await storage.createAuditEntry({
          complaintId: complaintId,
          action: 'workflow_manually_initiated',
          newValue: `${tasks.length} workflow tasks created manually`,
          userId: userId,
          reason: 'Manual workflow initialization'
        });
        
        res.json({ 
          success: true, 
          tasksCreated: tasks.length,
          workflowId: complaint.workflowId,
          message: `Successfully initialized workflow with ${tasks.length} tasks` 
        });
      } else {
        res.json({ 
          success: false, 
          message: `Workflow already initialized with ${existingTasks.length} tasks` 
        });
      }
    } catch (error) {
      console.error('Error initializing workflow:', error);
      res.status(500).json({ error: 'Failed to initialize workflow' });
    }
  });

  // Workflow Task Action Endpoints
  app.post('/api/workflow-tasks/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const approvedBy = req.user.claims.sub;
      const { reason } = req.body;
      
      // Get the workflow task
      const task = await storage.getWorkflowTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Workflow task not found' });
      }
      
      // Check if user has permission to approve
      const currentUser = await storage.getUser(approvedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canApprove = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canApprove && task.assignedTo !== approvedBy) {
        return res.status(403).json({ error: 'Not authorized to approve this task' });
      }
      
      // Complete the workflow task (which will create the next task automatically)
      const completedTask = await storage.completeWorkflowTask(taskId, approvedBy, reason);
      
      // Create audit entry
      await storage.createAuditEntry({
        complaintId: task.complaintId,
        action: 'workflow_task_approved',
        newValue: `Task "${task.taskName}" approved and completed by ${currentUser?.firstName} ${currentUser?.lastName}`,
        userId: approvedBy,
        reason: reason || 'Workflow task approved'
      });
      
      res.json(completedTask);
    } catch (error) {
      console.error('Error approving workflow task:', error);
      res.status(500).json({ error: 'Failed to approve workflow task' });
    }
  });

  // Test endpoint to manually trigger next workflow task creation
  app.post('/api/workflow-tasks/:id/test-next', async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getWorkflowTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ error: 'Workflow task not found' });
      }
      
      // Create next workflow task manually for testing
      await storage.createNextWorkflowTask(task);
      
      res.json({ message: 'Next workflow task creation triggered', taskId });
    } catch (error) {
      console.error('Error creating next workflow task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workflow-tasks/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const rejectedBy = req.user.claims.sub;
      const { reason } = req.body;
      
      // Get the workflow task
      const task = await storage.getWorkflowTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Workflow task not found' });
      }
      
      // Check if user has permission to reject
      const currentUser = await storage.getUser(rejectedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canReject = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canReject && task.assignedTo !== rejectedBy) {
        return res.status(403).json({ error: 'Not authorized to reject this task' });
      }
      
      // Complete the workflow task as rejected (which will handle workflow progression)
      const rejectedTask = await storage.completeWorkflowTask(taskId, rejectedBy, reason, 'rejected');
      
      // Create audit entry
      await storage.createAuditEntry({
        complaintId: task.complaintId,
        action: 'workflow_task_rejected',
        newValue: `Task "${task.taskName}" rejected by ${currentUser?.firstName} ${currentUser?.lastName}`,
        userId: rejectedBy,
        reason: reason || 'Workflow task rejected'
      });
      
      res.json(rejectedTask);
    } catch (error) {
      console.error('Error rejecting workflow task:', error);
      res.status(500).json({ error: 'Failed to reject workflow task' });
    }
  });

  app.post('/api/workflow-tasks/:id/forward', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const forwardedBy = req.user.claims.sub;
      const { forwardTo, comments } = req.body;
      
      // Get the workflow task
      const task = await storage.getWorkflowTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Workflow task not found' });
      }
      
      // Get the target user
      const targetUser = await storage.getUserByEmail?.(forwardTo);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      
      // Check if user has permission to forward
      const currentUser = await storage.getUser(forwardedBy);
      const userRoles = typeof currentUser?.roles === 'string' ? JSON.parse(currentUser.roles) : currentUser?.roles || [];
      const canForward = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));
      
      if (!canForward && task.assignedTo !== forwardedBy) {
        return res.status(403).json({ error: 'Not authorized to forward this task' });
      }
      
      // Update task assignment
      const forwardedTask = await storage.updateWorkflowTask(taskId, { 
        assignedTo: targetUser.id 
      });
      
      // Create audit entry
      await storage.createAuditEntry({
        complaintId: task.complaintId,
        action: 'workflow_task_forwarded',
        newValue: `Task "${task.taskName}" forwarded to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`,
        userId: forwardedBy,
        reason: comments || 'Workflow task forwarded'
      });
      
      res.json(forwardedTask);
    } catch (error) {
      console.error('Error forwarding workflow task:', error);
      res.status(500).json({ error: 'Failed to forward workflow task' });
    }
  });

  // Public complaint search (no authentication required)
  app.get('/api/complaints/public-search/:complaintId', async (req, res) => {
    try {
      const { complaintId } = req.params;
      
      if (!complaintId || !complaintId.trim()) {
        return res.status(400).json({ error: 'Complaint ID is required' });
      }

      const complaint = await storage.getComplaintByComplaintId(complaintId.trim().toUpperCase());
      
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      // Return only public-safe information (no sensitive internal data)
      const publicComplaint = {
        id: complaint.id,
        complaintId: complaint.complaintId,
        complaintType: complaint.complaintType,
        status: complaint.status,
        priority: complaint.priority,
        problemTypes: complaint.problemTypes,
        complaintDescription: complaint.complaintDescription,
        complainantFirstName: complaint.complainantFirstName,
        complainantLastName: complaint.complainantLastName,
        complainantPhone: complaint.complainantPhone,
        complainantEmail: complaint.complainantEmail,
        incidentAddress: complaint.incidentAddress,
        incidentCity: complaint.incidentCity,
        incidentState: complaint.incidentState,
        incidentZipCode: complaint.incidentZipCode,
        incidentDate: complaint.incidentDate,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      };

      res.json(publicComplaint);
    } catch (error) {
      console.error('Error searching complaint:', error);
      res.status(500).json({ error: 'Failed to search complaint' });
    }
  });

  // Email template routes
  app.get('/api/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      const { templateType, category, isActive } = req.query;
      const filters: any = {};
      
      if (templateType) filters.templateType = templateType;
      if (category) filters.category = category;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const templates = await storage.getEmailTemplates(filters);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  });

  app.post('/api/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRoles = typeof user?.roles === 'string' ? JSON.parse(user.roles) : user?.roles || [];
      
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      console.log('Email template creation request body:', req.body);
      console.log('User ID:', userId);
      
      const validatedData = insertEmailTemplateSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      console.log('Validated data:', validatedData);
      
      const template = await storage.createEmailTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.errors);
        const validationError = ValidationError.fromZodError(error);
        return res.status(400).json({ error: validationError.message, details: error.errors });
      }
      console.error('Error creating email template:', error);
      res.status(500).json({ error: 'Failed to create email template' });
    }
  });

  app.put('/api/email-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRoles = typeof user?.roles === 'string' ? JSON.parse(user.roles) : user?.roles || [];
      
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const template = await storage.updateEmailTemplate(id, updates);
      res.json(template);
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ error: 'Failed to update email template' });
    }
  });

  app.delete('/api/email-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRoles = typeof user?.roles === 'string' ? JSON.parse(user.roles) : user?.roles || [];
      
      if (!userRoles.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteEmailTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  });

  app.get('/api/email-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEmailTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ error: 'Email template not found' });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({ error: 'Failed to fetch email template' });
    }
  });

  app.get('/api/email-templates/by-type/:templateType', isAuthenticated, async (req, res) => {
    try {
      const { templateType } = req.params;
      const template = await storage.getEmailTemplateByType(templateType);
      
      if (!template) {
        return res.status(404).json({ error: 'Email template not found' });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error fetching email template by type:', error);
      res.status(500).json({ error: 'Failed to fetch email template' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('./uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
