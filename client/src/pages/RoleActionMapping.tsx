import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Role } from "@shared/schema";
import { Settings, Shield, Users, FileText, Calendar, Eye, Gavel } from "lucide-react";

interface ActionCategory {
  name: string;
  icon: any;
  actions: ActionDefinition[];
}

interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  requiredRoles: string[];
}

const ACTION_CATEGORIES: ActionCategory[] = [
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
        requiredRoles: ["field_staff"]
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
    icon: Calendar,
    actions: [
      {
        id: "timesheet_entry",
        name: "Timesheet Entry",
        description: "Enter and manage personal timesheets",
        requiredRoles: ["admin", "supervisor", "approver", "field_staff", "contract_staff"]
      },
      {
        id: "leave_request",
        name: "Leave Requests",
        description: "Submit leave requests",
        requiredRoles: ["admin", "supervisor", "approver", "field_staff", "contract_staff"]
      },
      {
        id: "overtime_request",
        name: "Overtime Requests", 
        description: "Submit overtime requests",
        requiredRoles: ["field_staff", "contract_staff"]
      },
      {
        id: "approve_leave",
        name: "Approve Leave",
        description: "Approve or reject leave requests",
        requiredRoles: ["supervisor", "approver"]
      },
      {
        id: "approve_overtime",
        name: "Approve Overtime",
        description: "Approve or reject overtime requests", 
        requiredRoles: ["supervisor", "approver"]
      }
    ]
  },
  {
    name: "Reporting",
    icon: Eye,
    actions: [
      {
        id: "audit_trail",
        name: "Audit Trail",
        description: "View system audit logs and activity",
        requiredRoles: ["admin", "supervisor", "approver"]
      },
      {
        id: "user_reports",
        name: "User Reports",
        description: "Generate user activity reports",
        requiredRoles: ["admin", "supervisor"]
      },
      {
        id: "complaint_statistics",
        name: "Complaint Statistics",
        description: "View complaint analytics and metrics",
        requiredRoles: ["admin", "supervisor", "approver"]
      }
    ]
  }
];

export default function RoleActionMapping() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const response = await fetch("/api/roles", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json() as Promise<Role[]>;
    },
  });

  // Initialize role permissions from database
  React.useEffect(() => {
    const permissions: Record<string, string[]> = {};
    roles.forEach(role => {
      // Use actual permissions from database if available, otherwise use default permissions
      if (role.permissions && Array.isArray(role.permissions)) {
        permissions[role.name] = role.permissions;
      } else {
        // Fallback to default permissions based on action definitions
        permissions[role.name] = [];
        ACTION_CATEGORIES.forEach(category => {
          category.actions.forEach(action => {
            if (action.requiredRoles.includes(role.name)) {
              permissions[role.name].push(action.id);
            }
          });
        });
      }
    });
    setRolePermissions(permissions);
  }, [roles]);

  const updateRolePermissions = useMutation({
    mutationFn: async ({ roleName, permissions }: { roleName: string; permissions: string[] }) => {
      return await apiRequest("PUT", `/api/roles/${roleName}/permissions`, { permissions });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update role permissions",
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = (roleName: string, actionId: string, checked: boolean) => {
    setRolePermissions(prev => {
      const rolePerms = prev[roleName] || [];
      const newPerms = checked 
        ? [...rolePerms, actionId]
        : rolePerms.filter(id => id !== actionId);
      return {
        ...prev,
        [roleName]: newPerms
      };
    });
  };

  const handleSavePermissions = (roleName: string) => {
    updateRolePermissions.mutate({
      roleName,
      permissions: rolePermissions[roleName] || []
    });
  };

  const getRoleBadgeVariant = (roleName: string) => {
    const variants = {
      admin: "destructive" as const,
      supervisor: "default" as const,
      approver: "secondary" as const,
      field_staff: "outline" as const,
      contract_staff: "outline" as const,
    };
    return variants[roleName as keyof typeof variants] || "outline";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Role-Action Mapping
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure which actions each role can perform in the system
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Role Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {roles.map(role => (
                <Card key={role.id} className="border-2">
                  <CardContent className="p-4 text-center">
                    <Badge variant={getRoleBadgeVariant(role.name)} className="mb-2">
                      {role.displayName}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {rolePermissions[role.name]?.length || 0} permissions
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full text-xs px-2 py-1"
                      onClick={() => setEditingRole(editingRole === role.name ? null : role.name)}
                    >
                      {editingRole === role.name ? "Cancel" : "Edit"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Categories Table */}
            {ACTION_CATEGORIES.map(category => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <category.icon className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Description</TableHead>
                        {roles.map(role => (
                          <TableHead key={role.id} className="text-center">
                            <Badge variant={getRoleBadgeVariant(role.name)} className="text-xs">
                              {role.name.replace('_', ' ')}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.actions.map(action => (
                        <TableRow key={action.id}>
                          <TableCell className="font-medium">{action.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {action.description}
                          </TableCell>
                          {roles.map(role => {
                            const hasPermission = rolePermissions[role.name]?.includes(action.id);
                            const isEditing = editingRole === role.name;
                            return (
                              <TableCell key={role.id} className="text-center">
                                {isEditing ? (
                                  <Checkbox
                                    checked={hasPermission}
                                    onCheckedChange={(checked) =>
                                      handlePermissionToggle(role.name, action.id, !!checked)
                                    }
                                  />
                                ) : (
                                  <Badge
                                    variant={hasPermission ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {hasPermission ? "✓" : "✗"}
                                  </Badge>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {/* Save Button for Editing Role */}
            {editingRole && (
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs px-3 py-1"
                  onClick={() => setEditingRole(null)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  className="text-xs px-3 py-1"
                  onClick={() => handleSavePermissions(editingRole)}
                  disabled={updateRolePermissions.isPending}
                >
                  {updateRolePermissions.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}