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
        const assignedUsers = users.filter(user => user.role === initialStage.assignedRole);
        
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

  app.put('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      const updatedUser = await storage.updateUserRole(userId, role);
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

  // Serve uploaded files
  app.use('/uploads', express.static('./uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
