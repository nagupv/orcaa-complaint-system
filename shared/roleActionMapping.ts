import { Settings, Shield, FileText, Clock, BarChart3 } from "lucide-react";

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  requiredRoles: string[];
}

export interface ActionCategory {
  name: string;
  icon: any;
  actions: ActionDefinition[];
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  {
    name: "Application Management",
    icon: Settings,
    actions: [
      {
        id: "user_management",
        name: "User Management",
        description: "Create, edit, and delete user accounts",
        requiredRoles: ["admin", "supervisor"]
      },
      {
        id: "role_management", 
        name: "Role Management",
        description: "Manage system roles and permissions",
        requiredRoles: ["admin"]
      },
      {
        id: "workflow_designer",
        name: "Workflow Designer",
        description: "Create and modify workflow templates",
        requiredRoles: ["admin", "supervisor"]
      },
      {
        id: "list_values",
        name: "List Values Management",
        description: "Manage system configuration values",
        requiredRoles: ["admin"]
      }
    ]
  },
  {
    name: "Workflow Tasks",
    icon: Shield,
    actions: [
      {
        id: "initial_inspection",
        name: "Initial Inspection",
        description: "Perform field inspections of complaints",
        requiredRoles: ["admin"]
      },
      {
        id: "safety_inspection",
        name: "Safety Inspection", 
        description: "Conduct safety-related inspections",
        requiredRoles: ["field_staff"]
      },
      {
        id: "assessment",
        name: "Assessment",
        description: "Review and assess complaint validity",
        requiredRoles: ["supervisor"]
      },
      {
        id: "enforcement_action",
        name: "Enforcement Action",
        description: "Take enforcement actions on violations",
        requiredRoles: ["admin", "supervisor"]
      },
      {
        id: "resolution",
        name: "Resolution",
        description: "Close and resolve complaints",
        requiredRoles: ["approver", "field_staff"]
      },
      {
        id: "reject_demolition",
        name: "Reject Demolition",
        description: "Reject demolition permit applications",
        requiredRoles: ["admin", "supervisor"]
      }
    ]
  },
  {
    name: "Complaint Management",
    icon: FileText,
    actions: [
      {
        id: "view_complaints",
        name: "View Complaints",
        description: "View complaint details and history",
        requiredRoles: ["admin", "supervisor", "approver", "field_staff", "contract_staff"]
      },
      {
        id: "create_complaints",
        name: "Create Complaints",
        description: "Create new complaint records",
        requiredRoles: ["admin", "supervisor", "field_staff"]
      },
      {
        id: "edit_complaints",
        name: "Edit Complaints", 
        description: "Modify complaint information",
        requiredRoles: ["admin", "supervisor"]
      },
      {
        id: "assign_complaints",
        name: "Assign Complaints",
        description: "Assign complaints to staff members",
        requiredRoles: ["admin", "supervisor"]
      }
    ]
  },
  {
    name: "Time Management",
    icon: Clock,
    actions: [
      {
        id: "timesheet_entry",
        name: "Timesheet Entry",
        description: "Record time entries and activities",
        requiredRoles: ["admin", "supervisor", "approver", "field_staff", "contract_staff"]
      },
      {
        id: "leave_requests",
        name: "Leave Requests",
        description: "Submit and manage leave requests",
        requiredRoles: ["admin", "supervisor", "approver", "field_staff", "contract_staff"]
      },
      {
        id: "approve_leave",
        name: "Approve Leave",
        description: "Approve or reject leave requests",
        requiredRoles: ["admin", "supervisor", "approver"]
      },
      {
        id: "overtime_requests",
        name: "Overtime Requests",
        description: "Submit and manage overtime requests",
        requiredRoles: ["admin", "supervisor", "approver", "field_staff", "contract_staff"]
      },
      {
        id: "approve_overtime",
        name: "Approve Overtime",
        description: "Approve or reject overtime requests",
        requiredRoles: ["admin", "supervisor", "approver"]
      }
    ]
  },
  {
    name: "Reporting",
    icon: BarChart3,
    actions: [
      {
        id: "view_reports",
        name: "View Reports",
        description: "Access system reports and analytics",
        requiredRoles: ["admin", "supervisor", "approver"]
      },
      {
        id: "export_data",
        name: "Export Data",
        description: "Export data and generate reports",
        requiredRoles: ["admin", "supervisor"]
      },
      {
        id: "audit_trail",
        name: "Audit Trail",
        description: "View system audit logs",
        requiredRoles: ["admin", "supervisor"]
      }
    ]
  }
];

/**
 * Get required roles for a specific action
 * @param actionId - The ID of the action (e.g., "initial_inspection")
 * @returns Array of role names that can perform this action
 */
export function getRequiredRolesForAction(actionId: string): string[] {
  for (const category of ACTION_CATEGORIES) {
    for (const action of category.actions) {
      if (action.id === actionId) {
        return action.requiredRoles;
      }
    }
  }
  return [];
}

/**
 * Get action definition by ID
 * @param actionId - The ID of the action
 * @returns ActionDefinition or undefined if not found
 */
export function getActionDefinition(actionId: string): ActionDefinition | undefined {
  for (const category of ACTION_CATEGORIES) {
    for (const action of category.actions) {
      if (action.id === actionId) {
        return action;
      }
    }
  }
  return undefined;
}

/**
 * Map workflow task types to action IDs
 * @param taskType - The task type from workflow (e.g., "INITIAL_INSPECTION")
 * @returns The corresponding action ID or undefined
 */
export function mapTaskTypeToActionId(taskType: string): string | undefined {
  const taskTypeMap: Record<string, string> = {
    'INITIAL_INSPECTION': 'initial_inspection',
    'SAFETY_INSPECTION': 'safety_inspection',
    'ASSESSMENT': 'assessment',
    'ENFORCEMENT_ACTION': 'enforcement_action',
    'RESOLUTION': 'resolution',
    'REJECT_DEMOLITION': 'reject_demolition'
  };
  
  return taskTypeMap[taskType];
}

/**
 * Check if a user has permission to perform an action
 * @param userRoles - Array of user's roles
 * @param actionId - The action ID to check
 * @returns Boolean indicating if user has permission
 */
export function hasPermission(userRoles: string[], actionId: string): boolean {
  const requiredRoles = getRequiredRolesForAction(actionId);
  return requiredRoles.some(role => userRoles.includes(role));
}