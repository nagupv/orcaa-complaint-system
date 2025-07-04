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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { USER_ROLES } from "@/lib/constants";
import { User } from "@shared/schema";
import { UserPlus, Edit, Save, X, Trash2 } from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  phone: z.string().nullable().optional(),
  mobileNumber: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
  enableSmsNotifications: z.boolean().default(true),
  enableWhatsappNotifications: z.boolean().default(true),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  phone: z.string().nullable().optional(),
  mobileNumber: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
  enableSmsNotifications: z.boolean().default(true),
  enableWhatsappNotifications: z.boolean().default(true),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type UpdateUserData = z.infer<typeof updateUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roles: [],
      phone: "",
      mobileNumber: "",
      whatsappNumber: "",
      enableSmsNotifications: true,
      enableWhatsappNotifications: true,
    },
  });

  const updateForm = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      roles: [],
      phone: "",
      mobileNumber: "",
      whatsappNumber: "",
      enableSmsNotifications: true,
      enableWhatsappNotifications: true,
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
      console.log("Attempting to create user with data:", data);
      try {
        const result = await apiRequest("POST", "/api/users", data);
        console.log("User creation successful:", result);
        return result;
      } catch (error) {
        console.error("User creation failed:", error);
        throw error;
      }
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
      console.error("Full error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast({
        title: "Failed to Create User",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; userData: UpdateUserData }) => {
      return await apiRequest("PUT", `/api/users/${data.id}`, data.userData);
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User account has been updated successfully.",
      });
      updateForm.reset();
      setEditingUser(null);
      setShowUpdateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User account has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update user roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      return await apiRequest("PUT", `/api/users/${userId}/roles`, { roles });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      setEditingUser(null);
      setEditRoles([]);
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
    console.log("Form data being submitted:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    
    createUserMutation.mutate(data);
  };

  const onUpdateSubmit = (data: UpdateUserData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUpdateForm(true);
    
    // Populate the update form with current user data
    const userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles || [];
    updateForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      roles: userRoles,
      phone: user.phone || "",
      mobileNumber: user.mobileNumber || "",
      whatsappNumber: user.whatsappNumber || "",
      enableSmsNotifications: user.enableSmsNotifications || true,
      enableWhatsappNotifications: user.enableWhatsappNotifications || true,
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleCancelUpdate = () => {
    setEditingUser(null);
    setShowUpdateForm(false);
    updateForm.reset();
  };

  const handleEditRole = (userId: string, currentRoles: string[]) => {
    setEditingUser(userId);
    setEditRoles(currentRoles);
  };

  const handleSaveRole = (userId: string) => {
    updateRolesMutation.mutate({ userId, roles: editRoles });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditRoles([]);
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
                <Label htmlFor="mobileNumber">Mobile Number (SMS)</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  {...form.register("mobileNumber")}
                  placeholder="For SMS notifications"
                />
              </div>

              <div>
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  {...form.register("whatsappNumber")}
                  placeholder="For WhatsApp notifications"
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
                <Label htmlFor="roles">Roles *</Label>
                <div className="space-y-2">
                  {USER_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.value}
                        checked={form.watch("roles")?.includes(role.value)}
                        onCheckedChange={(checked) => {
                          const currentRoles = form.watch("roles") || [];
                          console.log(`Role ${role.value} ${checked ? 'checked' : 'unchecked'}, current roles:`, currentRoles);
                          if (checked) {
                            const newRoles = [...currentRoles, role.value];
                            form.setValue("roles", newRoles);
                            console.log("New roles after adding:", newRoles);
                          } else {
                            const newRoles = currentRoles.filter((r) => r !== role.value);
                            form.setValue("roles", newRoles);
                            console.log("New roles after removing:", newRoles);
                          }
                        }}
                      />
                      <Label htmlFor={role.value} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.roles && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.roles.message}</p>
                )}
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Notification Preferences</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableSmsNotifications"
                    checked={form.watch("enableSmsNotifications")}
                    onCheckedChange={(checked) => {
                      form.setValue("enableSmsNotifications", checked as boolean);
                    }}
                  />
                  <Label htmlFor="enableSmsNotifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable SMS Notifications
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableWhatsappNotifications"
                    checked={form.watch("enableWhatsappNotifications")}
                    onCheckedChange={(checked) => {
                      form.setValue("enableWhatsappNotifications", checked as boolean);
                    }}
                  />
                  <Label htmlFor="enableWhatsappNotifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable WhatsApp Notifications
                  </Label>
                </div>
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

      {/* Update User Form */}
      {showUpdateForm && editingUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Update User: {editingUser.email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="update-firstName">First Name</Label>
                  <Input
                    id="update-firstName"
                    {...updateForm.register("firstName")}
                    placeholder="Enter first name"
                  />
                  {updateForm.formState.errors.firstName && (
                    <p className="text-sm text-red-600">{updateForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="update-lastName">Last Name</Label>
                  <Input
                    id="update-lastName"
                    {...updateForm.register("lastName")}
                    placeholder="Enter last name"
                  />
                  {updateForm.formState.errors.lastName && (
                    <p className="text-sm text-red-600">{updateForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="update-phone">Phone Number</Label>
                  <Input
                    id="update-phone"
                    {...updateForm.register("phone")}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="update-mobileNumber">Mobile Number</Label>
                  <Input
                    id="update-mobileNumber"
                    {...updateForm.register("mobileNumber")}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <Label htmlFor="update-whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="update-whatsappNumber"
                    {...updateForm.register("whatsappNumber")}
                    placeholder="Enter WhatsApp number"
                  />
                </div>
              </div>

              <div>
                <Label>User Roles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {USER_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`update-role-${role.value}`}
                        checked={updateForm.watch("roles")?.includes(role.value) || false}
                        onCheckedChange={(checked) => {
                          const currentRoles = updateForm.getValues("roles") || [];
                          if (checked) {
                            updateForm.setValue("roles", [...currentRoles, role.value]);
                          } else {
                            updateForm.setValue("roles", currentRoles.filter(r => r !== role.value));
                          }
                        }}
                      />
                      <Label htmlFor={`update-role-${role.value}`} className="text-sm">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {updateForm.formState.errors.roles && (
                  <p className="text-sm text-red-600">{updateForm.formState.errors.roles.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-enableSmsNotifications"
                    checked={updateForm.watch("enableSmsNotifications") || false}
                    onCheckedChange={(checked) => updateForm.setValue("enableSmsNotifications", checked as boolean)}
                  />
                  <Label htmlFor="update-enableSmsNotifications">Enable SMS Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-enableWhatsappNotifications"
                    checked={updateForm.watch("enableWhatsappNotifications") || false}
                    onCheckedChange={(checked) => updateForm.setValue("enableWhatsappNotifications", checked as boolean)}
                  />
                  <Label htmlFor="update-enableWhatsappNotifications">Enable WhatsApp Notifications</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelUpdate}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
                          <p className="text-sm text-gray-600">Phone: {user.phone}</p>
                        )}
                        {user.mobileNumber && (
                          <p className="text-sm text-gray-600">Mobile: {user.mobileNumber}</p>
                        )}
                        {user.whatsappNumber && (
                          <p className="text-sm text-gray-600">WhatsApp: {user.whatsappNumber}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {user.enableSmsNotifications && (
                            <Badge variant="secondary" className="text-xs">SMS</Badge>
                          )}
                          {user.enableWhatsappNotifications && (
                            <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {editingUser === user.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              {USER_ROLES.map((role) => (
                                <div key={role.value} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`edit-${role.value}`}
                                    checked={editRoles.includes(role.value)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditRoles([...editRoles, role.value]);
                                      } else {
                                        setEditRoles(editRoles.filter((r) => r !== role.value));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`edit-${role.value}`} className="text-xs">
                                    {role.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSaveRole(user.id)}
                              disabled={updateRolesMutation.isPending}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            {(typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles).map((role: string) => (
                              <Badge key={role} className={getRoleBadgeColor(role)}>
                                {USER_ROLES.find(r => r.value === role)?.label || role}
                              </Badge>
                            ))}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                                title="Edit User Details"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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