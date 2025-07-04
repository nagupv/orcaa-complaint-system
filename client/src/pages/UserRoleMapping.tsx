import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, UserX, Settings, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Role } from "@shared/schema";

export default function UserRoleMapping() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      await apiRequest("PUT", `/api/users/${userId}/roles`, { roles });
    },
    onSuccess: () => {
      toast({
        title: "User roles updated successfully",
        description: "The user's role assignments have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setUserRoles([]);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error updating user roles",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditRoles = (user: User) => {
    setSelectedUserId(user.id);
    const currentRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
    setUserRoles(currentRoles);
    setIsDialogOpen(true);
  };

  const handleRoleToggle = (roleName: string, checked: boolean) => {
    if (checked) {
      setUserRoles(prev => [...prev, roleName]);
    } else {
      setUserRoles(prev => prev.filter(role => role !== roleName));
    }
  };

  const handleSaveRoles = () => {
    if (selectedUserId) {
      updateRolesMutation.mutate({
        userId: selectedUserId,
        roles: userRoles
      });
    }
  };

  const getUserRoles = (user: User) => {
    return typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles?.find((r: Role) => r.name === roleName);
    return role?.displayName || roleName;
  };

  const selectedUser = users?.find((u: User) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            User and Role Mapping
          </h2>
          <p className="text-muted-foreground">
            Assign and manage user role assignments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Role Assignments</CardTitle>
          <CardDescription>
            View and modify role assignments for each user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user: User) => {
                    const userRolesList = getUserRoles(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRolesList.length > 0 ? (
                              userRolesList.map((roleName: string) => (
                                <Badge key={roleName} variant="default" className="text-xs">
                                  {getRoleDisplayName(roleName)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">No roles assigned</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRoles(user)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <UserX className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Roles for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Available Roles</h4>
              {rolesLoading ? (
                <div className="text-center py-4">Loading roles...</div>
              ) : (
                <div className="space-y-2">
                  {roles && roles.length > 0 ? (
                    roles
                      .filter((role: Role) => role.isActive)
                      .map((role: Role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={userRoles.includes(role.name)}
                            onCheckedChange={(checked) => 
                              handleRoleToggle(role.name, checked as boolean)
                            }
                          />
                          <label 
                            htmlFor={`role-${role.id}`} 
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {role.displayName}
                          </label>
                          {role.description && (
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles available</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRoles}
                disabled={updateRolesMutation.isPending}
                className="bg-orcaa-blue hover:bg-orcaa-blue/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Roles
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}