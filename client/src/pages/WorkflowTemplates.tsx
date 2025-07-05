import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, FileText, AlertTriangle, CheckCircle } from "lucide-react";

type Workflow = {
  id: number;
  name: string;
  description: string;
  complaintType: string | null;
  isTemplate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function WorkflowTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [selectedComplaintType, setSelectedComplaintType] = useState<string>("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch all workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
  });

  // Fetch current templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/workflow-templates"],
  });

  const assignTemplateMutation = useMutation({
    mutationFn: ({ workflowId, complaintType }: { workflowId: number; complaintType: string }) => 
      apiRequest("POST", `/api/workflow-templates/${workflowId}/${complaintType}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow template assigned successfully",
      });
      setShowAssignDialog(false);
      setSelectedWorkflow(null);
      setSelectedComplaintType("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign workflow template",
        variant: "destructive",
      });
    },
  });

  const handleAssignTemplate = () => {
    if (selectedWorkflow && selectedComplaintType) {
      assignTemplateMutation.mutate({
        workflowId: selectedWorkflow,
        complaintType: selectedComplaintType,
      });
    }
  };

  const complaintTypes = [
    { value: "AIR_QUALITY", label: "Air Quality Complaints" },
    { value: "DEMOLITION_NOTICE", label: "Demolition Notices" },
  ];

  const getTemplateForType = (complaintType: string) => {
    return templates.find((t: Workflow) => t.complaintType === complaintType);
  };

  const availableWorkflows = workflows.filter((w: Workflow) => w.isActive);

  if (workflowsLoading || templatesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading workflow templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Templates</h1>
          <p className="text-muted-foreground mt-2">
            Configure default workflows for different complaint types to streamline processing
          </p>
        </div>
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Workflow Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="complaintType">Complaint Type</Label>
                <Select value={selectedComplaintType} onValueChange={setSelectedComplaintType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select complaint type" />
                  </SelectTrigger>
                  <SelectContent>
                    {complaintTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="workflow">Workflow</Label>
                <Select 
                  value={selectedWorkflow?.toString() || ""} 
                  onValueChange={(value) => setSelectedWorkflow(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkflows.map((workflow: Workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id.toString()}>
                        {workflow.name}
                        {workflow.description && (
                          <span className="text-muted-foreground ml-2">
                            - {workflow.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignTemplate}
                  disabled={!selectedWorkflow || !selectedComplaintType || assignTemplateMutation.isPending}
                >
                  {assignTemplateMutation.isPending ? "Assigning..." : "Assign Template"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {complaintTypes.map((type) => {
          const template = getTemplateForType(type.value);
          
          return (
            <Card key={type.value} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{type.label}</span>
                  </div>
                  {template ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {template ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-lg">{template.name}</h4>
                      {template.description && (
                        <p className="text-muted-foreground text-sm">{template.description}</p>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        Template ID: {template.id} | 
                        Last Updated: {new Date(template.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        This workflow will be automatically assigned to new {type.label.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      No workflow template configured for {type.label.toLowerCase()}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Complaints of this type will need manual workflow assignment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableWorkflows.length === 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Available</h3>
            <p className="text-muted-foreground">
              Create workflows in the Workflow Designer first, then return here to configure templates.
            </p>
          </CardContent>
        </Card>
      )}

      {templates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Template Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>{templates.length}</strong> workflow template(s) configured
              </p>
              <p className="text-sm text-muted-foreground">
                New complaints will be automatically assigned to their respective workflow templates when created.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}