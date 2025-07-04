import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { USER_ROLES } from "@/lib/constants";
import { User } from "@shared/schema";
import { UserPlus, Edit, Save, X } from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>("");

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "",
      phone: "",
    },
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      return await apiRequest("/api/users", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user account has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest(`/api/users/${userId}/role`, "PUT", { role });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      setEditingUser(null);
      setEditRole("");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  const handleEditRole = (userId: string, currentRole: string) => {
    setEditingUser(userId);
    setEditRole(currentRole);
  };

  const handleSaveRole = (userId: string) => {
    updateRoleMutation.mutate({ userId, role: editRole });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditRole("");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-purple-100 text-purple-800";
      case "approver":
        return "bg-blue-100 text-blue-800";
      case "contract_staff":
        return "bg-orange-100 text-orange-800";
      case "field_staff":
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
      </div>

      {/* Create New User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  className={form.formState.errors.firstName ? "border-red-500" : ""}
                />
                {form.formState.errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  className={form.formState.errors.lastName ? "border-red-500" : ""}
                />
                {form.formState.errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.lastName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select onValueChange={(value) => form.setValue("role", value)}>
                  <SelectTrigger className={form.formState.errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="bg-orcaa-blue hover:bg-orcaa-blue/90 text-white"
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Users */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="space-y-4">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-600">{user.phone}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <Select value={editRole} onValueChange={setEditRole}>
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {USER_ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleSaveRole(user.id)}
                              disabled={updateRoleMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRole(user.id, user.role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {users?.length === 0 && (
                <p className="text-gray-600 text-center py-8">No users found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}