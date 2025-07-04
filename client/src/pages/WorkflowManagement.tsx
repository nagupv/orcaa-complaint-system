import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WorkflowStage, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import WorkflowStageCard from "@/components/WorkflowStageCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function WorkflowManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflowStages, isLoading: stagesLoading } = useQuery({
    queryKey: ["/api/workflow-stages"],
    queryFn: async () => {
      const response = await fetch("/api/workflow-stages", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch workflow stages");
      return response.json() as Promise<WorkflowStage[]>;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
  });

  const updateWorkflowStage = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WorkflowStage> }) => {
      const response = await apiRequest("PUT", `/api/workflow-stages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-stages"] });
      toast({
        title: "Success",
        description: "Workflow stage updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workflow stage",
        variant: "destructive",
      });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/users/${id}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleStageUpdate = (id: number, data: Partial<WorkflowStage>) => {
    updateWorkflowStage.mutate({ id, data });
  };

  const handleUserRoleUpdate = (id: string, role: string) => {
    updateUserRole.mutate({ id, role });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "approver":
        return "bg-purple-100 text-purple-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "contract_staff":
        return "bg-green-100 text-green-800";
      case "field_staff":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatRoleName = (role: string) => {
    if (!role || typeof role !== 'string') return '';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (stagesLoading || usersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Workflow Management</h2>
      </div>

      {/* Workflow Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Workflow Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowStages?.map((stage) => (
              <WorkflowStageCard
                key={stage.id}
                stage={stage}
                onUpdate={handleStageUpdate}
                users={users || []}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Management */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles && (typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles).map((role: string) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {formatRoleName(role)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // This would open a role selection dialog
                            const currentRoles = user.roles && (typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles) || [];
                            const newRoles = prompt("Enter roles (comma-separated):", currentRoles.join(', '));
                            if (newRoles && newRoles !== currentRoles.join(', ')) {
                              handleUserRoleUpdate(user.id, newRoles.split(',').map(r => r.trim()));
                            }
                          }}
                        >
                          Edit Role
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
