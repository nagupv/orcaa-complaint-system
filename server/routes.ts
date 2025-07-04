import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertComplaintSchema, insertWorkDescriptionSchema, insertAuditSchema } from "@shared/schema";
import { handleFileUpload } from "./services/fileUpload";
import { sendSMSNotification } from "./services/twilioService";
import multer from "multer";
import path from "path";
import { z } from "zod";

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
              `New complaint ${complaint.complaintId} assigned to you. Please check the ORCAA system.`
            );
          }
        }
      }

      res.json(complaint);
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

      res.json(complaint);
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
      
      // Generate a temporary user ID (this would normally be handled by the auth provider)
      const userId = `temp_${Date.now()}`;
      
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
        isActive: true,
      });

      // Create audit entry for user creation
      await storage.createAuditEntry({
        action: 'user_created',
        newValue: `${firstName} ${lastName} (${email}) - ${roles.join(', ')}`,
        userId: req.user.claims.sub,
        reason: `New user account created: ${email} with roles ${roles.join(', ')}`
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

  // Serve uploaded files
  app.use('/uploads', express.static('./uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
