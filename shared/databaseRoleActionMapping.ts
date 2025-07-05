import { storage } from "../server/storage";

/**
 * Database-driven Role-Action Mapping utilities for dynamic workflow task assignment
 * This replaces the static file-based approach with persistent database storage
 */

// Action ID mappings for workflow task types
const TASK_TYPE_TO_ACTION_MAP: Record<string, string> = {
  'INITIAL_INSPECTION': 'initial_inspection',
  'SAFETY_INSPECTION': 'safety_inspection', 
  'ASSESSMENT': 'assessment',
  'ENFORCEMENT_ACTION': 'enforcement_action',
  'RESOLUTION': 'resolution',
  'REJECT_DEMOLITION': 'reject_demolition'
};

/**
 * Maps a workflow task type to its corresponding action ID
 * @param taskType - The workflow task type (e.g., 'INITIAL_INSPECTION')
 * @returns The corresponding action ID or null if not found
 */
export function mapTaskTypeToActionId(taskType: string): string | null {
  return TASK_TYPE_TO_ACTION_MAP[taskType] || null;
}

/**
 * Gets the required roles for a specific action from the database
 * @param actionId - The action ID to query roles for
 * @returns Promise<string[]> - Array of role names that have permission for this action
 */
export async function getRequiredRolesForAction(actionId: string): Promise<string[]> {
  try {
    const roles = await storage.getRolesForAction(actionId);
    return roles;
  } catch (error) {
    console.error(`Error fetching roles for action ${actionId}:`, error);
    return []; // Return empty array if database query fails
  }
}

/**
 * Gets all action permissions for a specific role from the database
 * @param roleName - The role name to query permissions for
 * @returns Promise<string[]> - Array of action IDs the role has permission for
 */
export async function getActionPermissionsForRole(roleName: string): Promise<string[]> {
  try {
    const mappings = await storage.getRoleActionMappingsByRole(roleName);
    return mappings
      .filter(mapping => mapping.hasPermission)
      .map(mapping => mapping.actionId);
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleName}:`, error);
    return []; // Return empty array if database query fails
  }
}

/**
 * Checks if a specific role has permission for a specific action
 * @param roleName - The role name to check
 * @param actionId - The action ID to check permission for
 * @returns Promise<boolean> - True if the role has permission, false otherwise
 */
export async function hasRolePermissionForAction(roleName: string, actionId: string): Promise<boolean> {
  try {
    const mappings = await storage.getRoleActionMappingsByRole(roleName);
    const mapping = mappings.find(m => m.actionId === actionId);
    return mapping?.hasPermission || false;
  } catch (error) {
    console.error(`Error checking permission for role ${roleName} and action ${actionId}:`, error);
    return false; // Return false if database query fails
  }
}

/**
 * Gets all role-action mappings organized by category
 * @returns Promise<Record<string, any[]>> - Mappings organized by category
 */
export async function getAllRoleActionMappingsByCategory(): Promise<Record<string, any[]>> {
  try {
    const mappings = await storage.getRoleActionMappings();
    const categorized: Record<string, any[]> = {};
    
    mappings.forEach(mapping => {
      if (!categorized[mapping.actionCategory]) {
        categorized[mapping.actionCategory] = [];
      }
      
      // Find existing action or create new one
      let action = categorized[mapping.actionCategory].find(a => a.id === mapping.actionId);
      if (!action) {
        action = {
          id: mapping.actionId,
          name: mapping.actionName,
          description: mapping.actionDescription || '',
          requiredRoles: []
        };
        categorized[mapping.actionCategory].push(action);
      }
      
      // Add role if it has permission
      if (mapping.hasPermission && !action.requiredRoles.includes(mapping.roleName)) {
        action.requiredRoles.push(mapping.roleName);
      }
    });
    
    return categorized;
  } catch (error) {
    console.error('Error fetching role-action mappings by category:', error);
    return {}; // Return empty object if database query fails
  }
}

/**
 * Legacy compatibility function for existing code that expects ACTION_CATEGORIES format
 * @returns Promise<any[]> - Action categories in the expected format
 */
export async function getActionCategories(): Promise<any[]> {
  try {
    const categorizedMappings = await getAllRoleActionMappingsByCategory();
    
    const categories = Object.keys(categorizedMappings).map(categoryName => ({
      name: categoryName,
      icon: null, // Icons would need to be mapped separately
      actions: categorizedMappings[categoryName]
    }));
    
    return categories;
  } catch (error) {
    console.error('Error converting to ACTION_CATEGORIES format:', error);
    return []; // Return empty array if conversion fails
  }
}