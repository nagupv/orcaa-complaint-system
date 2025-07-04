import {
  users,
  complaints,
  attachments,
  workflowStages,
  workDescriptions,
  auditTrail,
  type User,
  type UpsertUser,
  type Complaint,
  type InsertComplaint,
  type Attachment,
  type WorkflowStage,
  type InsertWorkflowStage,
  type WorkDescription,
  type InsertWorkDescription,
  type AuditEntry,
  type InsertAuditEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // Complaint operations
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  getComplaint(id: number): Promise<Complaint | undefined>;
  getComplaintByComplaintId(complaintId: string): Promise<Complaint | undefined>;
  updateComplaint(id: number, updates: Partial<Complaint>): Promise<Complaint>;
  getComplaints(filters?: {
    status?: string;
    problemType?: string;
    assignedTo?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }): Promise<Complaint[]>;
  getComplaintStatistics(): Promise<{
    total: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  }>;
  
  // File operations
  createAttachment(attachment: Omit<Attachment, "id" | "uploadedAt">): Promise<Attachment>;
  getAttachments(complaintId: number): Promise<Attachment[]>;
  
  // Workflow operations
  getWorkflowStages(): Promise<WorkflowStage[]>;
  createWorkflowStage(stage: InsertWorkflowStage): Promise<WorkflowStage>;
  updateWorkflowStage(id: number, updates: Partial<WorkflowStage>): Promise<WorkflowStage>;
  
  // Work description operations
  createWorkDescription(description: InsertWorkDescription): Promise<WorkDescription>;
  getWorkDescriptions(complaintId: number): Promise<WorkDescription[]>;
  
  // Audit trail operations
  createAuditEntry(entry: InsertAuditEntry): Promise<AuditEntry>;
  getAuditTrail(complaintId?: number): Promise<AuditEntry[]>;
  
  // Helper methods
  generateComplaintId(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Complaint operations
  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const complaintId = await this.generateComplaintId();
    const [newComplaint] = await db
      .insert(complaints)
      .values({ ...complaint, complaintId })
      .returning();
    return newComplaint;
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, id));
    return complaint;
  }

  async getComplaintByComplaintId(complaintId: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.complaintId, complaintId));
    return complaint;
  }

  async updateComplaint(id: number, updates: Partial<Complaint>): Promise<Complaint> {
    const [complaint] = await db
      .update(complaints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complaints.id, id))
      .returning();
    return complaint;
  }

  async getComplaints(filters?: {
    status?: string;
    problemType?: string;
    assignedTo?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }): Promise<Complaint[]> {
    let query = db.select().from(complaints);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(complaints.status, filters.status));
      }
      
      if (filters.assignedTo) {
        conditions.push(eq(complaints.assignedTo, filters.assignedTo));
      }
      
      if (filters.dateFrom) {
        conditions.push(gte(complaints.createdAt, filters.dateFrom));
      }
      
      if (filters.dateTo) {
        conditions.push(lte(complaints.createdAt, filters.dateTo));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(complaints.complaintId, `%${filters.search}%`),
            like(complaints.sourceName, `%${filters.search}%`),
            like(complaints.complainantEmail, `%${filters.search}%`),
            like(complaints.sourceAddress, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(complaints.createdAt));
  }

  async getComplaintStatistics(): Promise<{
    total: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  }> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        inProgress: sql<number>`count(case when status in ('initiated', 'inspection', 'work_in_progress') then 1 end)`,
        resolved: sql<number>`count(case when status in ('closed', 'approved') then 1 end)`,
        urgent: sql<number>`count(case when priority = 'urgent' then 1 end)`,
      })
      .from(complaints);
    
    return {
      total: Number(stats.total),
      inProgress: Number(stats.inProgress),
      resolved: Number(stats.resolved),
      urgent: Number(stats.urgent),
    };
  }

  // File operations
  async createAttachment(attachment: Omit<Attachment, "id" | "uploadedAt">): Promise<Attachment> {
    const [newAttachment] = await db
      .insert(attachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getAttachments(complaintId: number): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(eq(attachments.complaintId, complaintId));
  }

  // Workflow operations
  async getWorkflowStages(): Promise<WorkflowStage[]> {
    return await db
      .select()
      .from(workflowStages)
      .where(eq(workflowStages.isActive, true))
      .orderBy(workflowStages.order);
  }

  async createWorkflowStage(stage: InsertWorkflowStage): Promise<WorkflowStage> {
    const [newStage] = await db
      .insert(workflowStages)
      .values(stage)
      .returning();
    return newStage;
  }

  async updateWorkflowStage(id: number, updates: Partial<WorkflowStage>): Promise<WorkflowStage> {
    const [stage] = await db
      .update(workflowStages)
      .set(updates)
      .where(eq(workflowStages.id, id))
      .returning();
    return stage;
  }

  // Work description operations
  async createWorkDescription(description: InsertWorkDescription): Promise<WorkDescription> {
    const [newDescription] = await db
      .insert(workDescriptions)
      .values(description)
      .returning();
    return newDescription;
  }

  async getWorkDescriptions(complaintId: number): Promise<WorkDescription[]> {
    return await db
      .select()
      .from(workDescriptions)
      .where(eq(workDescriptions.complaintId, complaintId))
      .orderBy(desc(workDescriptions.createdAt));
  }

  // Audit trail operations
  async createAuditEntry(entry: InsertAuditEntry): Promise<AuditEntry> {
    const [newEntry] = await db
      .insert(auditTrail)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getAuditTrail(complaintId?: number): Promise<AuditEntry[]> {
    let query = db.select().from(auditTrail);
    
    if (complaintId) {
      query = query.where(eq(auditTrail.complaintId, complaintId));
    }
    
    return await query.orderBy(desc(auditTrail.timestamp));
  }

  // Helper methods
  async generateComplaintId(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(complaints)
      .where(like(complaints.complaintId, `AQ-${year}-%`));
    
    const nextNumber = Number(result.count) + 1;
    return `AQ-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }
}

export const storage = new DatabaseStorage();
