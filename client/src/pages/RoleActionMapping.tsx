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
// Database-driven approach - no static import needed
import { Gavel, Users, Workflow, FileText, Clock, BarChart } from "lucide-react";

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

  // Fetch role-action mappings from database
  const { data: roleActionMappings = [] } = useQuery({
    queryKey: ["/api/role-action-mappings"],
    queryFn: async () => {
      const response = await fetch("/api/role-action-mappings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch role-action mappings");
      return response.json();
    },
  });

  // Initialize role permissions from database
  React.useEffect(() => {
    const permissions: Record<string, string[]> = {};
    roles.forEach(role => {
      permissions[role.name] = [];
      roleActionMappings.forEach((mapping: any) => {
        if (mapping.roleName === role.name && mapping.hasPermission) {
          permissions[role.name].push(mapping.actionId);
        }
      });
    });
    setRolePermissions(permissions);
  }, [roles, roleActionMappings]);

  // Create action categories from database mappings
  const actionCategories = React.useMemo(() => {
    const categoryMap = new Map();
    
    // Icon mapping for categories
    const categoryIcons: Record<string, any> = {
      'Application Management': Users,
      'Workflow Tasks': Workflow,
      'Complaint Management': FileText,
      'Time Management': Clock,
      'Reporting': BarChart
    };

    roleActionMappings.forEach((mapping: any) => {
      if (!categoryMap.has(mapping.actionCategory)) {
        categoryMap.set(mapping.actionCategory, {
          name: mapping.actionCategory,
          icon: categoryIcons[mapping.actionCategory] || Gavel,
          actions: []
        });
      }
      
      const category = categoryMap.get(mapping.actionCategory);
      let action = category.actions.find((a: any) => a.id === mapping.actionId);
      
      if (!action) {
        action = {
          id: mapping.actionId,
          name: mapping.actionName,
          description: mapping.actionDescription || '',
          requiredRoles: []
        };
        category.actions.push(action);
      }
      
      // Add role if it has permission and isn't already included
      if (mapping.hasPermission && !action.requiredRoles.includes(mapping.roleName)) {
        action.requiredRoles.push(mapping.roleName);
      }
    });

    return Array.from(categoryMap.values());
  }, [roleActionMappings]);

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
    const variants: Record<string, any> = {
      admin: "destructive",
      supervisor: "default",
      approver: "secondary",
      field_staff: "outline",
      contract_staff: "outline",
    };
    return variants[roleName] || "outline";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading roles...</div>
      </div>
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
            {actionCategories.map(category => (
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

            {/* Save Button */}
            {editingRole && (
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSavePermissions(editingRole)}
                  disabled={updateRolePermissions.isPending}
                  className="bg-orcaa-blue hover:bg-orcaa-blue/90"
                >
                  {updateRolePermissions.isPending ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}