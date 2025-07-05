import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Edit, Trash2, FileText, Send, Copy } from "lucide-react";
import { insertEmailTemplateSchema, type EmailTemplate, type InsertEmailTemplate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const formSchema = insertEmailTemplateSchema.omit({ 
  createdBy: true, 
  createdAt: true, 
  updatedAt: true 
});

type FormData = z.infer<typeof formSchema>;

const EMAIL_CATEGORIES = [
  "Workflow",
  "Notification", 
  "System",
  "Communication",
  "Alert"
];

const TEMPLATE_TYPES = [
  "complaint_received",
  "inspection_scheduled", 
  "inspection_completed",
  "resolution_update",
  "workflow_completed",
  "approval_required",
  "task_assigned",
  "deadline_reminder",
  "escalation_notice",
  "status_update"
];

const EMAIL_VARIABLES = [
  "{{complaintId}}", 
  "{{complaintType}}", 
  "{{status}}", 
  "{{assignedTo}}", 
  "{{description}}", 
  "{{date}}", 
  "{{time}}", 
  "{{dueDate}}", 
  "{{priority}}", 
  "{{location}}", 
  "{{contactName}}", 
  "{{contactEmail}}", 
  "{{contactPhone}}", 
  "{{notes}}"
];

export default function EmailTemplateConfig() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      variables: [],
      category: "Workflow",
      templateType: "complaint_received",
      description: "",
      isActive: true
    }
  });

  // Fetch email templates
  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('/api/email-templates')
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: InsertEmailTemplate) => 
      apiRequest('/api/email-templates', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Email template created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email template",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailTemplate> }) =>
      apiRequest(`/api/email-templates/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setEditingTemplate(null);
      form.reset();
      toast({
        title: "Success",
        description: "Email template updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update email template",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/email-templates/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Success",
        description: "Email template deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email template", 
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: FormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ 
        id: editingTemplate.id, 
        data: { ...data, updatedAt: new Date() }
      });
    } else {
      createTemplateMutation.mutate(data as InsertEmailTemplate);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
      category: template.category,
      templateType: template.templateType,
      description: template.description || "",
      isActive: template.isActive
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this email template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const addVariable = (variable: string) => {
    const currentVariables = form.getValues("variables") || [];
    if (!currentVariables.includes(variable)) {
      form.setValue("variables", [...currentVariables, variable]);
    }
  };

  const removeVariable = (variable: string) => {
    const currentVariables = form.getValues("variables") || [];
    form.setValue("variables", currentVariables.filter(v => v !== variable));
  };

  const insertVariableIntoBody = (variable: string) => {
    const currentBody = form.getValues("body");
    form.setValue("body", currentBody + " " + variable);
  };

  const filteredTemplates = templates.filter(template => 
    selectedCategory === "all" || template.category === selectedCategory
  );

  if (isLoading) {
    return <div className="p-6">Loading email templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Template Configuration</h1>
          <p className="text-muted-foreground">
            Create and manage email templates for workflow notifications
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null);
              form.reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Email Template" : "Create Email Template"}
              </DialogTitle>
              <DialogDescription>
                Configure email templates for automated workflow notifications
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Template Details</TabsTrigger>
                    <TabsTrigger value="content">Email Content</TabsTrigger>
                    <TabsTrigger value="variables">Variables</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Complaint Received Notification" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="templateType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Type *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TEMPLATE_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EMAIL_CATEGORIES.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                              <FormLabel className="text-base">Active Template</FormLabel>
                              <FormDescription>
                                Enable this template for use in workflows
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
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
                              placeholder="Describe when this template should be used"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., ORCAA Complaint {{complaintId}} - Status Update" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Body *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dear {{contactName}},&#10;&#10;We have received your air quality complaint {{complaintId}}..."
                              className="min-h-[300px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use variables like {`{{complaintId}}`} and {`{{contactName}}`} for dynamic content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="variables" className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Available Variables</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click to add variables to your email content
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        {EMAIL_VARIABLES.map(variable => (
                          <Button
                            key={variable}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertVariableIntoBody(variable)}
                            className="justify-start text-xs"
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            {variable}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Selected Variables</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Variables included in this template
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(form.watch("variables") || []).map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 p-0 h-auto"
                              onClick={() => removeVariable(variable)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {EMAIL_CATEGORIES.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Templates grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    <Badge 
                      variant={template.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                  <p className="text-sm">
                    {template.templateType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                  <p className="text-sm truncate">{template.subject}</p>
                </div>
                {template.description && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                )}
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Variables</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.slice(0, 3).map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No email templates found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory === "all" 
                ? "Create your first email template to get started" 
                : `No templates found in the ${selectedCategory} category`
              }
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}