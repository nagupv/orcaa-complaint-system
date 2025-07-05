import {
  users,
  complaints,
  attachments,
  workflowStages,
  workDescriptions,
  auditTrail,
  roles,
  listValues,
  timesheets,
  leaveRequests,
  overtimeRequests,
  workflows,
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
  type Role,
  type InsertRole,
  type ListValue,
  type InsertListValue,
  type Timesheet,
  type InsertTimesheet,
  type LeaveRequest,
  type InsertLeaveRequest,
  type OvertimeRequest,
  type InsertOvertimeRequest,
  type Workflow,
  type InsertWorkflow,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserRoles(id: string, roles: string[]): Promise<User>;
  
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
  
  // Role operations
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, updates: Partial<Role>): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  getRoleById(id: number): Promise<Role | undefined>;
  
  // List values operations
  getListValues(): Promise<ListValue[]>;
  createListValue(listValue: InsertListValue): Promise<ListValue>;
  updateListValue(id: number, updates: Partial<ListValue>): Promise<ListValue>;
  deleteListValue(id: number): Promise<void>;
  getListValueById(id: number): Promise<ListValue | undefined>;
  
  // Chart data methods
  getMonthlyComplaintStats(): Promise<Array<{
    month: string;
    total: number;
    inProgress: number;
    resolved: number;
  }>>;
  getYearlyComplaintStats(): Promise<Array<{
    month: string;
    total: number;
    inProgress: number;
    resolved: number;
  }>>;
  
  // Timesheet operations
  getTimesheets(userId?: string, dateFrom?: Date, dateTo?: Date): Promise<Timesheet[]>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: number, updates: Partial<Timesheet>): Promise<Timesheet>;
  deleteTimesheet(id: number): Promise<void>;
  getTimesheetById(id: number): Promise<Timesheet | undefined>;
  getTimesheetActivities(): Promise<string[]>;
  
  // Leave request operations
  getLeaveRequests(userId?: string, status?: string): Promise<LeaveRequest[]>;
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest>;
  deleteLeaveRequest(id: number): Promise<void>;
  getLeaveRequestById(id: number): Promise<LeaveRequest | undefined>;
  approveLeaveRequest(id: number, approvedBy: string): Promise<LeaveRequest>;
  rejectLeaveRequest(id: number, approvedBy: string, reason?: string): Promise<LeaveRequest>;
  
  // Overtime request operations
  getOvertimeRequests(userId?: string, status?: string): Promise<OvertimeRequest[]>;
  createOvertimeRequest(overtimeRequest: InsertOvertimeRequest): Promise<OvertimeRequest>;
  updateOvertimeRequest(id: number, updates: Partial<OvertimeRequest>): Promise<OvertimeRequest>;
  deleteOvertimeRequest(id: number): Promise<void>;
  getOvertimeRequestById(id: number): Promise<OvertimeRequest | undefined>;
  approveOvertimeRequest(id: number, approvedBy: string): Promise<OvertimeRequest>;
  rejectOvertimeRequest(id: number, approvedBy: string, reason?: string): Promise<OvertimeRequest>;
  
  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: number): Promise<void>;
  getWorkflowById(id: number): Promise<Workflow | undefined>;
  getWorkflowTemplates(): Promise<Workflow[]>;
  getTemplateForComplaintType(complaintType: string): Promise<Workflow | undefined>;
  setTemplateForComplaintType(workflowId: number, complaintType: string): Promise<Workflow>;
  assignWorkflowToComplaint(complaintId: number, workflowId?: number): Promise<void>;
  
  // Helper methods
  generateComplaintId(serviceType?: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...updates, 
        roles: updates.roles ? JSON.stringify(updates.roles) : undefined,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserRoles(id: string, roles: string[]): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ roles: JSON.stringify(roles), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Complaint operations
  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const complaintId = await this.generateComplaintId(complaint.complaintType);
    
    // Get the template workflow for this complaint type
    const template = await this.getTemplateForComplaintType(complaint.complaintType || "AIR_QUALITY");
    const workflowId = template?.id || null;
    
    const [newComplaint] = await db
      .insert(complaints)
      .values({ ...complaint, complaintId, workflowId })
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
    try {
      // Get total count first
      const totalCount = await db.select({ count: sql<number>`count(*)` }).from(complaints);
      const total = Number(totalCount[0]?.count || 0);
      
      // Get individual counts
      const inProgressCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`status in ('initiated', 'inspection', 'work_in_progress')`);
      
      const resolvedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`status in ('closed', 'approved')`);
      
      const urgentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`priority = 'urgent'`);
      
      return {
        total,
        inProgress: Number(inProgressCount[0]?.count || 0),
        resolved: Number(resolvedCount[0]?.count || 0),
        urgent: Number(urgentCount[0]?.count || 0),
      };
    } catch (error) {
      console.error("Error fetching complaint statistics:", error);
      return {
        total: 0,
        inProgress: 0,
        resolved: 0,
        urgent: 0,
      };
    }
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

  // Role operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.displayName);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, updates: Partial<Role>): Promise<Role> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getRoleById(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  // List values operations
  async getListValues(): Promise<ListValue[]> {
    return await db.select().from(listValues).orderBy(listValues.listValueCode, listValues.order);
  }

  async createListValue(listValue: InsertListValue): Promise<ListValue> {
    const [newListValue] = await db.insert(listValues).values(listValue).returning();
    return newListValue;
  }

  async updateListValue(id: number, updates: Partial<ListValue>): Promise<ListValue> {
    const [updatedListValue] = await db
      .update(listValues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listValues.id, id))
      .returning();
    return updatedListValue;
  }

  async deleteListValue(id: number): Promise<void> {
    await db.delete(listValues).where(eq(listValues.id, id));
  }

  async getListValueById(id: number): Promise<ListValue | undefined> {
    const [listValue] = await db.select().from(listValues).where(eq(listValues.id, id));
    return listValue;
  }

  // Chart data methods
  async getMonthlyComplaintStats(): Promise<Array<{
    month: string;
    total: number;
    inProgress: number;
    resolved: number;
  }>> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    const monthlyStats = [];
    
    for (let month = 1; month <= currentMonth; month++) {
      const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' });
      
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`EXTRACT(YEAR FROM created_at) = ${currentYear} AND EXTRACT(MONTH FROM created_at) = ${month}`);
      
      const [inProgressResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`EXTRACT(YEAR FROM created_at) = ${currentYear} AND EXTRACT(MONTH FROM created_at) = ${month} AND status IN ('initiated', 'in_progress', 'inspection')`);
      
      const [resolvedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`EXTRACT(YEAR FROM created_at) = ${currentYear} AND EXTRACT(MONTH FROM created_at) = ${month} AND status IN ('resolved', 'closed')`);
      
      monthlyStats.push({
        month: monthName,
        total: Number(totalResult.count) || 0,
        inProgress: Number(inProgressResult.count) || 0,
        resolved: Number(resolvedResult.count) || 0,
      });
    }
    
    return monthlyStats;
  }

  async getYearlyComplaintStats(): Promise<Array<{
    month: string;
    total: number;
    inProgress: number;
    resolved: number;
  }>> {
    const currentDate = new Date();
    const yearlyStats = [];
    
    // Get last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`EXTRACT(YEAR FROM created_at) = ${year} AND EXTRACT(MONTH FROM created_at) = ${month}`);
      
      const [inProgressResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`EXTRACT(YEAR FROM created_at) = ${year} AND EXTRACT(MONTH FROM created_at) = ${month} AND status IN ('initiated', 'in_progress', 'inspection')`);
      
      const [resolvedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(complaints)
        .where(sql`EXTRACT(YEAR FROM created_at) = ${year} AND EXTRACT(MONTH FROM created_at) = ${month} AND status IN ('resolved', 'closed')`);
      
      yearlyStats.push({
        month: monthName,
        total: Number(totalResult.count) || 0,
        inProgress: Number(inProgressResult.count) || 0,
        resolved: Number(resolvedResult.count) || 0,
      });
    }
    
    return yearlyStats;
  }

  // Timesheet operations
  async getTimesheets(userId?: string, dateFrom?: Date, dateTo?: Date): Promise<Timesheet[]> {
    let query = db.select().from(timesheets);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(timesheets.userId, userId));
    }
    if (dateFrom) {
      conditions.push(gte(timesheets.date, dateFrom.toISOString().split('T')[0]));
    }
    if (dateTo) {
      conditions.push(lte(timesheets.date, dateTo.toISOString().split('T')[0]));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(timesheets.date), desc(timesheets.createdAt));
  }

  async createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet> {
    const [newTimesheet] = await db
      .insert(timesheets)
      .values(timesheet)
      .returning();
    return newTimesheet;
  }

  async updateTimesheet(id: number, updates: Partial<Timesheet>): Promise<Timesheet> {
    const [updatedTimesheet] = await db
      .update(timesheets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(timesheets.id, id))
      .returning();
    return updatedTimesheet;
  }

  async deleteTimesheet(id: number): Promise<void> {
    await db.delete(timesheets).where(eq(timesheets.id, id));
  }

  async getTimesheetById(id: number): Promise<Timesheet | undefined> {
    const [timesheet] = await db.select().from(timesheets).where(eq(timesheets.id, id));
    return timesheet;
  }

  async getTimesheetActivities(): Promise<string[]> {
    const activities = await db
      .select({ activity: listValues.listValue })
      .from(listValues)
      .where(and(
        eq(listValues.listValueType, 'TIMESHEET_ACTIVITY'),
        eq(listValues.isActive, true)
      ))
      .orderBy(listValues.order);
    
    return activities.map(a => a.activity);
  }

  // Leave request operations
  async getLeaveRequests(userId?: string, status?: string): Promise<LeaveRequest[]> {
    let query = db.select().from(leaveRequests);
    
    if (userId) {
      query = query.where(eq(leaveRequests.userId, userId));
    }
    if (status) {
      query = query.where(eq(leaveRequests.status, status));
    }
    
    return await query.orderBy(desc(leaveRequests.createdAt));
  }

  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const [request] = await db
      .insert(leaveRequests)
      .values(leaveRequest)
      .returning();
    return request;
  }

  async updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const [request] = await db
      .update(leaveRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return request;
  }

  async deleteLeaveRequest(id: number): Promise<void> {
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
  }

  async getLeaveRequestById(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request;
  }

  async approveLeaveRequest(id: number, approvedBy: string): Promise<LeaveRequest> {
    const [request] = await db
      .update(leaveRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return request;
  }

  async rejectLeaveRequest(id: number, approvedBy: string, reason?: string): Promise<LeaveRequest> {
    const [request] = await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return request;
  }

  // Overtime request operations
  async getOvertimeRequests(userId?: string, status?: string): Promise<OvertimeRequest[]> {
    let query = db.select().from(overtimeRequests);
    
    if (userId) {
      query = query.where(eq(overtimeRequests.userId, userId));
    }
    if (status) {
      query = query.where(eq(overtimeRequests.status, status));
    }
    
    return await query.orderBy(desc(overtimeRequests.createdAt));
  }

  async createOvertimeRequest(overtimeRequest: InsertOvertimeRequest): Promise<OvertimeRequest> {
    const [request] = await db
      .insert(overtimeRequests)
      .values(overtimeRequest)
      .returning();
    return request;
  }

  async updateOvertimeRequest(id: number, updates: Partial<OvertimeRequest>): Promise<OvertimeRequest> {
    const [request] = await db
      .update(overtimeRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(overtimeRequests.id, id))
      .returning();
    return request;
  }

  async deleteOvertimeRequest(id: number): Promise<void> {
    await db.delete(overtimeRequests).where(eq(overtimeRequests.id, id));
  }

  async getOvertimeRequestById(id: number): Promise<OvertimeRequest | undefined> {
    const [request] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, id));
    return request;
  }

  async approveOvertimeRequest(id: number, approvedBy: string): Promise<OvertimeRequest> {
    const [request] = await db
      .update(overtimeRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(overtimeRequests.id, id))
      .returning();
    return request;
  }

  async rejectOvertimeRequest(id: number, approvedBy: string, reason?: string): Promise<OvertimeRequest> {
    const [request] = await db
      .update(overtimeRequests)
      .set({
        status: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(overtimeRequests.id, id))
      .returning();
    return request;
  }

  // Helper methods
  async generateComplaintId(serviceType?: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = serviceType === "DEMOLITION_NOTICE" ? "DN" : "AQ";
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(complaints)
      .where(like(complaints.complaintId, `${prefix}-${year}-%`));
    
    const nextNumber = Number(result.count) + 1;
    return `${prefix}-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Workflow operations
  async getWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows).orderBy(workflows.createdAt);
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        ...workflow,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newWorkflow;
  }

  async updateWorkflow(id: number, updates: Partial<Workflow>): Promise<Workflow> {
    const [updatedWorkflow] = await db
      .update(workflows)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  async getWorkflowById(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async getWorkflowTemplates(): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.isTemplate, true)).orderBy(workflows.complaintType, workflows.name);
  }

  async getTemplateForComplaintType(complaintType: string): Promise<Workflow | undefined> {
    const [template] = await db
      .select()
      .from(workflows)
      .where(and(
        eq(workflows.complaintType, complaintType),
        eq(workflows.isTemplate, true),
        eq(workflows.isActive, true)
      ));
    return template;
  }

  async setTemplateForComplaintType(workflowId: number, complaintType: string): Promise<Workflow> {
    // First, remove template status from any existing templates for this complaint type
    await db
      .update(workflows)
      .set({ isTemplate: false })
      .where(and(
        eq(workflows.complaintType, complaintType),
        eq(workflows.isTemplate, true)
      ));

    // Then set the new template
    const [template] = await db
      .update(workflows)
      .set({ 
        complaintType,
        isTemplate: true,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, workflowId))
      .returning();
    
    return template;
  }

  async assignWorkflowToComplaint(complaintId: number, workflowId?: number): Promise<void> {
    // If no workflowId provided, auto-assign based on complaint type
    if (!workflowId) {
      const [complaint] = await db.select().from(complaints).where(eq(complaints.id, complaintId));
      if (complaint) {
        const template = await this.getTemplateForComplaintType(complaint.complaintType);
        if (template) {
          workflowId = template.id;
        }
      }
    }

    if (workflowId) {
      await db
        .update(complaints)
        .set({ workflowId, updatedAt: new Date() })
        .where(eq(complaints.id, complaintId));
    }
  }
}

export const storage = new DatabaseStorage();
