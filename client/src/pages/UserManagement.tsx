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
import { UserPlus, Edit, Save, X } from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  phone: z.string().optional(),
  mobileNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  enableSmsNotifications: z.boolean().default(true),
  enableWhatsappNotifications: z.boolean().default(true),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

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
    
    // Check if form is valid before submitting
    if (!form.formState.isValid) {
      console.error("Form validation failed:", form.formState.errors);
      toast({
        title: "Form Validation Error",
        description: "Please check all required fields",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(data);
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRole(user.id, typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles)}
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