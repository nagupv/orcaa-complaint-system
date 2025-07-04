import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Users, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertRoleSchema, type Role } from "@shared/schema";

const AVAILABLE_PERMISSIONS = [
  "create_complaints",
  "edit_complaints", 
  "delete_complaints",
  "manage_users",
  "manage_roles",
  "view_audit_trail",
  "send_notifications",
  "manage_workflow"
];

const roleSchema = insertRoleSchema.extend({
  permissions: z.array(z.string()).default([])
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RoleManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      await apiRequest("POST", "/api/roles", data);
    },
    onSuccess: () => {
      toast({
        title: "Role created successfully",
        description: "The role has been created and is now available for assignment.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RoleFormData }) => {
      await apiRequest("PUT", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Role updated successfully",
        description: "The role has been updated with the new information.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setIsDialogOpen(false);
      setEditingRole(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Role deleted successfully",
        description: "The role has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      permissions: [],
      isActive: true,
    },
  });

  const onSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      isActive: role.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role Management
          </h2>
          <p className="text-muted-foreground">
            Create and manage system roles with specific permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orcaa-blue hover:bg-orcaa-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="field_staff" {...field} />
                        </FormControl>
                        <FormDescription>
                          Internal name (lowercase, use underscores)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Field Staff" {...field} />
                        </FormControl>
                        <FormDescription>
                          Human-readable name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role and its responsibilities..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_PERMISSIONS.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={field.value.includes(permission)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, permission]);
                                } else {
                                  field.onChange(field.value.filter((p) => p !== permission));
                                }
                              }}
                            />
                            <label htmlFor={permission} className="text-sm font-medium">
                              {permission.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Active Role</FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-orcaa-blue hover:bg-orcaa-blue/90"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
          <CardDescription>
            Manage roles and their permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading roles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles && roles.length > 0 ? (
                  roles.map((role: Role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.displayName}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions && Array.isArray(role.permissions) ? (
                            role.permissions.map((permission: string) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission.replace(/_/g, " ")}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">No permissions</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No roles found</p>
                        <p className="text-sm text-muted-foreground">
                          Create your first role to get started
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}