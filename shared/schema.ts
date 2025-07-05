import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  roles: jsonb("roles").notNull().default('["field_staff"]'), // Array of roles: field_staff, contract_staff, supervisor, approver, admin
  phone: varchar("phone"),
  mobileNumber: varchar("mobile_number"),
  whatsappNumber: varchar("whatsapp_number"),
  enableSmsNotifications: boolean("enable_sms_notifications").default(true),
  enableWhatsappNotifications: boolean("enable_whatsapp_notifications").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintId: varchar("complaint_id").notNull().unique(), // Auto-generated like AQ-2024-001
  complaintType: varchar("complaint_type").notNull().default("AIR_QUALITY"), // AIR_QUALITY, DEMOLITION_NOTICE
  
  // Complainant Information
  isAnonymous: boolean("is_anonymous").default(false),
  complainantFirstName: varchar("complainant_first_name"),
  complainantLastName: varchar("complainant_last_name"),
  complainantEmail: varchar("complainant_email").notNull(),
  complainantAddress: text("complainant_address"),
  complainantCity: varchar("complainant_city"),
  complainantState: varchar("complainant_state"),
  complainantZipCode: varchar("complainant_zip_code"),
  complainantPhone: varchar("complainant_phone"),
  
  // Source Information
  sourceName: varchar("source_name", { length: 50 }),
  sourceAddress: text("source_address"),
  sourceCity: varchar("source_city"),
  problemTypes: jsonb("problem_types"), // Array of strings: smoke, industrial, odor, etc.
  otherDescription: text("other_description"),
  lastOccurred: timestamp("last_occurred"),
  previousContact: boolean("previous_contact").default(false),
  
  // Workflow and Status
  status: varchar("status").notNull().default("initiated"), // initiated, inspection, work_in_progress, work_completed, reviewed, approved, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  workflowId: integer("workflow_id").references(() => workflows.id), // Links to the assigned workflow
  
  // Demolition Notification specific fields
  propertyOwnerName: varchar("property_owner_name"),
  propertyOwnerEmail: varchar("property_owner_email"),
  propertyOwnerPhone: varchar("property_owner_phone"),
  propertyOwnerAddress: text("property_owner_address"),
  workSiteAddress: text("work_site_address"),
  workSiteCity: varchar("work_site_city"),
  workSiteZip: varchar("work_site_zip"),
  workSiteCounty: varchar("work_site_county"),
  isPrimaryResidence: boolean("is_primary_residence"),
  asbestosToBeRemoved: boolean("asbestos_to_be_removed"),
  asbestosNotificationNumber: varchar("asbestos_notification_number"),
  projectStartDate: timestamp("project_start_date"),
  projectCompletionDate: timestamp("project_completion_date"),
  asbestosSquareFeet: integer("asbestos_square_feet"),
  asbestosLinearFeet: integer("asbestos_linear_feet"),
  asbestosContractorName: varchar("asbestos_contractor_name"),
  isNeshapProject: boolean("is_neshap_project"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File attachments table
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Workflow stages configuration
export const workflowStages = pgTable("workflow_stages", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // initiated, inspection, etc.
  displayName: varchar("display_name").notNull(),
  assignedRole: varchar("assigned_role").notNull(),
  nextStage: varchar("next_stage"),
  order: integer("order").notNull(),
  smsNotification: boolean("sms_notification").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Work descriptions and updates
export const workDescriptions = pgTable("work_descriptions", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => users.id),
  status: varchar("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit trail table
export const auditTrail = pgTable("audit_trail", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // created, status_changed, assigned, updated, closed
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  userId: varchar("user_id").references(() => users.id),
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Roles table for dynamic role management
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(), // e.g., "field_staff", "admin"
  displayName: varchar("display_name").notNull(), // e.g., "Field Staff", "Administrator"
  description: text("description"),
  permissions: jsonb("permissions").default("[]"), // Array of permission strings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role-Action Mapping table for dynamic workflow task assignment
export const roleActionMapping = pgTable("role_action_mapping", {
  id: serial("id").primaryKey(),
  roleName: varchar("role_name").notNull().references(() => roles.name),
  actionId: varchar("action_id").notNull(), // e.g., "initial_inspection", "assessment"
  actionName: varchar("action_name").notNull(), // e.g., "Initial Inspection", "Assessment"
  actionDescription: text("action_description"), // Description of the action
  actionCategory: varchar("action_category").notNull(), // e.g., "Workflow Tasks", "Application Management"
  hasPermission: boolean("has_permission").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_role_action").on(table.roleName, table.actionId),
]);

// List values table for managing configuration values
export const listValues = pgTable("list_values", {
  id: serial("id").primaryKey(),
  listValueType: varchar("list_value_type", { length: 100 }).notNull(),
  listValueCode: varchar("list_value_code", { length: 100 }).notNull(),
  listValueDescr: text("list_value_descr").notNull(),
  order: integer("order").notNull(),
  listValue: varchar("list_value", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Timesheets table for tracking user work hours
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  activity: varchar("activity", { length: 100 }).notNull(),
  comments: text("comments"),
  businessWorkId: varchar("business_work_id", { length: 50 }),
  timeInHours: decimal("time_in_hours", { precision: 4, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave requests table
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  leaveType: varchar("leave_type").notNull(), // vacation, sick, personal, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: decimal("total_days", { precision: 4, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"), // Reason for rejection
  comments: text("comments"), // Admin comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Overtime requests table
export const overtimeRequests = pgTable("overtime_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  businessWorkId: varchar("business_work_id"), // Optional complaint ID reference
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"), // Reason for rejection
  comments: text("comments"), // Admin comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow storage table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  workflowData: jsonb("workflow_data").notNull(), // stores nodes, edges, and metadata
  complaintType: varchar("complaint_type"), // AIR_QUALITY, DEMOLITION_NOTICE, or null for generic workflows
  isTemplate: boolean("is_template").default(false), // true for default templates
  isActive: boolean("is_active").default(true), // enable/disable workflows
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow tasks table - for active workflow instances
export const workflowTasks = pgTable("workflow_tasks", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull().references(() => complaints.id),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  taskType: varchar("task_type").notNull(), // INITIAL_INSPECTION, ASSESSMENT, ENFORCEMENT_ACTION, RESOLUTION, SAFETY_INSPECTION, REJECT_DEMOLITION
  taskName: varchar("task_name").notNull(),
  assignedTo: varchar("assigned_to").notNull().references(() => users.id),
  assignedRole: varchar("assigned_role").notNull(), // Role that should handle this task
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, approved, rejected, forwarded
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  
  // Task specific data
  observations: text("observations"), // For inspection tasks
  inspectionStatus: varchar("inspection_status"), // approved, rejected, forward
  forwardEmail: varchar("forward_email"), // Email to forward to
  forwardReason: text("forward_reason"), // Reason for forwarding
  
  // Task completion data
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  completionNotes: text("completion_notes"),
  
  // Additional metadata
  taskData: jsonb("task_data"), // Store task-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inbox items table - for centralized task management
export const inboxItems = pgTable("inbox_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemType: varchar("item_type").notNull(), // WORKFLOW_TASK, COMPLAINT, LEAVE_REQUEST, OVERTIME_REQUEST
  itemId: integer("item_id").notNull(), // Reference to the actual item
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  status: varchar("status").notNull().default("unread"), // unread, read, in_progress, completed
  dueDate: timestamp("due_date"),
  
  // Metadata
  complaintId: integer("complaint_id").references(() => complaints.id), // Optional complaint reference
  workflowTaskId: integer("workflow_task_id").references(() => workflowTasks.id), // Optional workflow task reference
  
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email templates table - for storing reusable email templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  templateType: varchar("template_type").notNull(), // complaint_received, status_update, action_required, etc.
  isActive: boolean("is_active").default(true),
  variables: jsonb("variables").$type<string[]>().default([]),
  description: text("description"),
  category: varchar("category").default("general"), // general, complaint, workflow, notification
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [complaints.assignedTo],
    references: [users.id],
  }),
  workflow: one(workflows, {
    fields: [complaints.workflowId],
    references: [workflows.id],
  }),
  attachments: many(attachments),
  workDescriptions: many(workDescriptions),
  auditEntries: many(auditTrail),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedComplaints: many(complaints),
  workDescriptions: many(workDescriptions),
  auditEntries: many(auditTrail),
  timesheets: many(timesheets),
  leaveRequests: many(leaveRequests),
  overtimeRequests: many(overtimeRequests),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  complaint: one(complaints, {
    fields: [attachments.complaintId],
    references: [complaints.id],
  }),
}));

export const workDescriptionsRelations = relations(workDescriptions, ({ one }) => ({
  complaint: one(complaints, {
    fields: [workDescriptions.complaintId],
    references: [complaints.id],
  }),
  user: one(users, {
    fields: [workDescriptions.userId],
    references: [users.id],
  }),
}));

export const auditTrailRelations = relations(auditTrail, ({ one }) => ({
  complaint: one(complaints, {
    fields: [auditTrail.complaintId],
    references: [complaints.id],
  }),
  user: one(users, {
    fields: [auditTrail.userId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  // No direct relations for now, but can add user mappings later
}));

export const listValuesRelations = relations(listValues, ({ }) => ({
  // No direct relations for now
}));

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  user: one(users, {
    fields: [timesheets.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
  }),
}));

export const overtimeRequestsRelations = relations(overtimeRequests, ({ one }) => ({
  user: one(users, {
    fields: [overtimeRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [overtimeRequests.approvedBy],
    references: [users.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  creator: one(users, {
    fields: [workflows.createdBy],
    references: [users.id],
  }),
  complaints: many(complaints),
  workflowTasks: many(workflowTasks),
}));

export const workflowTasksRelations = relations(workflowTasks, ({ one }) => ({
  complaint: one(complaints, {
    fields: [workflowTasks.complaintId],
    references: [complaints.id],
  }),
  workflow: one(workflows, {
    fields: [workflowTasks.workflowId],
    references: [workflows.id],
  }),
  assignedUser: one(users, {
    fields: [workflowTasks.assignedTo],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [workflowTasks.completedBy],
    references: [users.id],
  }),
}));

export const inboxItemsRelations = relations(inboxItems, ({ one }) => ({
  user: one(users, {
    fields: [inboxItems.userId],
    references: [users.id],
  }),
  complaint: one(complaints, {
    fields: [inboxItems.complaintId],
    references: [complaints.id],
  }),
  workflowTask: one(workflowTasks, {
    fields: [inboxItems.workflowTaskId],
    references: [workflowTasks.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [emailTemplates.createdBy],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  complaintId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkDescriptionSchema = createInsertSchema(workDescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditSchema = createInsertSchema(auditTrail).omit({
  id: true,
  timestamp: true,
});

export const insertWorkflowStageSchema = createInsertSchema(workflowStages).omit({
  id: true,
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListValueSchema = createInsertSchema(listValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOvertimeRequestSchema = createInsertSchema(overtimeRequests).omit({
  id: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowTaskSchema = createInsertSchema(workflowTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInboxItemSchema = createInsertSchema(inboxItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleActionMappingSchema = createInsertSchema(roleActionMapping).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type WorkflowStage = typeof workflowStages.$inferSelect;
export type InsertWorkflowStage = z.infer<typeof insertWorkflowStageSchema>;
export type WorkDescription = typeof workDescriptions.$inferSelect;
export type InsertWorkDescription = z.infer<typeof insertWorkDescriptionSchema>;
export type AuditEntry = typeof auditTrail.$inferSelect;
export type InsertAuditEntry = z.infer<typeof insertAuditSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type ListValue = typeof listValues.$inferSelect;
export type InsertListValue = z.infer<typeof insertListValueSchema>;
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type OvertimeRequest = typeof overtimeRequests.$inferSelect;
export type InsertOvertimeRequest = z.infer<typeof insertOvertimeRequestSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type InsertWorkflowTask = z.infer<typeof insertWorkflowTaskSchema>;
export type InboxItem = typeof inboxItems.$inferSelect;
export type InsertInboxItem = z.infer<typeof insertInboxItemSchema>;
export type RoleActionMapping = typeof roleActionMapping.$inferSelect;
export type InsertRoleActionMapping = z.infer<typeof insertRoleActionMappingSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
