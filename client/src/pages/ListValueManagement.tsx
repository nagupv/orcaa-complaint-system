import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { insertListValueSchema, type ListValue, type InsertListValue } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

type ListValueFormData = z.infer<typeof insertListValueSchema>;

const listValueFormSchema = insertListValueSchema.extend({
  listValueType: z.string().min(1, "Type is required"),
  listValueCode: z.string().min(1, "Code is required"),
  listValueDescr: z.string().min(1, "Description is required"),
  order: z.number().min(0, "Order must be non-negative"),
  listValue: z.string().min(1, "Value is required"),
});

export default function ListValueManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingListValue, setEditingListValue] = useState<ListValue | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug state changes
  console.log('ListValueManagement render - isCreateDialogOpen:', isCreateDialogOpen);
  console.log('ListValueManagement render - editingListValue:', editingListValue);

  const form = useForm<ListValueFormData>({
    resolver: zodResolver(listValueFormSchema),
    defaultValues: {
      listValueType: "",
      listValueCode: "",
      listValueDescr: "",
      order: 0,
      listValue: "",
      isActive: true,
    },
  });

  const { data: listValues = [], isLoading } = useQuery<ListValue[]>({
    queryKey: ["/api/list-values"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ListValueFormData) => {
      console.log('Mutation: Making API request with data:', data);
      try {
        const result = await apiRequest("/api/list-values", "POST", data);
        console.log('Mutation: API request successful, result:', result);
        return result;
      } catch (error) {
        console.error('Mutation: API request failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Mutation: Success callback triggered');
      queryClient.invalidateQueries({ queryKey: ["/api/list-values"] });
      toast({
        title: "Success",
        description: "List value created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Mutation: Error callback triggered:', error);
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
        title: "Error",
        description: error.message || "Failed to create list value",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ListValueFormData }) => {
      return await apiRequest(`/api/list-values/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/list-values"] });
      toast({
        title: "Success",
        description: "List value updated successfully",
      });
      setEditingListValue(null);
      form.reset();
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
        title: "Error",
        description: "Failed to update list value",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/list-values/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/list-values"] });
      toast({
        title: "Success",
        description: "List value deleted successfully",
      });
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
        title: "Error",
        description: "Failed to delete list value",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListValueFormData) => {
    console.log('Form submission data:', data);
    console.log('Form validation errors:', form.formState.errors);
    
    if (editingListValue) {
      updateMutation.mutate({ id: editingListValue.id, data });
    } else {
      console.log('Creating new list value with data:', data);
      createMutation.mutate(data);
    }
  };

  const handleEdit = (listValue: ListValue) => {
    setEditingListValue(listValue);
    form.reset({
      listValueType: listValue.listValueType,
      listValueCode: listValue.listValueCode,
      listValueDescr: listValue.listValueDescr,
      order: listValue.order,
      listValue: listValue.listValue,
      isActive: listValue.isActive ?? true,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this list value?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingListValue(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orcaa-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">List Values Management</h1>
          <p className="text-muted-foreground">
            Manage configuration list values used throughout the application
          </p>
        </div>
        <Button 
          onClick={() => {
            console.log('Add List Value button clicked');
            setIsCreateDialogOpen(true);
          }}
          className="bg-orcaa-blue hover:bg-orcaa-blue/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add List Value
        </Button>
        
        <Dialog open={isCreateDialogOpen || !!editingListValue} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingListValue ? "Edit List Value" : "Create New List Value"}
              </DialogTitle>
              <DialogDescription>
                {editingListValue ? "Update the list value details below." : "Add a new configuration list value to the system."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="listValueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Value Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., PRIORITY, STATUS, CATEGORY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="listValueCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List Value Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PRIORITY_LEVEL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="listValueDescr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description of this list value..." 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., High Priority" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable or disable this list value
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-orcaa-blue hover:bg-orcaa-blue/90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {editingListValue ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List Values</CardTitle>
          <CardDescription>
            All configuration values in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listValues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No list values found</p>
              <Button
                onClick={() => {
                  console.log('Create your first list value button clicked');
                  setIsCreateDialogOpen(true);
                }}
                variant="outline"
                className="mt-4"
              >
                Create your first list value
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listValues
                  .sort((a: ListValue, b: ListValue) => {
                    if (a.listValueCode !== b.listValueCode) {
                      return a.listValueCode.localeCompare(b.listValueCode);
                    }
                    return a.order - b.order;
                  })
                  .map((listValue: ListValue) => (
                    <TableRow key={listValue.id}>
                      <TableCell className="font-medium">
                        {listValue.listValueType}
                      </TableCell>
                      <TableCell>
                        {listValue.listValueCode}
                      </TableCell>
                      <TableCell>
                        {listValue.listValueDescr}
                      </TableCell>
                      <TableCell>
                        {listValue.listValue}
                      </TableCell>
                      <TableCell>
                        {listValue.order}
                      </TableCell>
                      <TableCell>
                        <Badge variant={listValue.isActive ? "default" : "secondary"}>
                          {listValue.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(listValue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(listValue.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}