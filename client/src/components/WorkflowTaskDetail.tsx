import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WorkflowTask, User } from "@shared/schema";
import { CheckCircle, Clock, AlertTriangle, User as UserIcon, Calendar, Eye, Search, Gavel, Shield, X, History, FileText } from "lucide-react";

interface WorkflowTaskDetailProps {
  taskId: number;
  onTaskUpdate?: () => void;
}

export default function WorkflowTaskDetail({ taskId, onTaskUpdate }: WorkflowTaskDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [observations, setObservations] = useState("");
  const [inspectionStatus, setInspectionStatus] = useState("");
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardReason, setForwardReason] = useState("");

  // Fetch task details
  const { data: task, isLoading } = useQuery({
    queryKey: ["/api/workflow-tasks", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-tasks/${taskId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch task");
      return response.json() as Promise<WorkflowTask>;
    },
  });

  // Fetch complaint details
  const { data: complaint } = useQuery({
    queryKey: ["/api/complaints", task?.complaintId],
    queryFn: async () => {
      const response = await fetch(`/api/complaints/${task?.complaintId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch complaint");
      return response.json();
    },
    enabled: !!task?.complaintId,
  });

  // Fetch complaint attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ["/api/complaints", task?.complaintId, "attachments"],
    queryFn: async () => {
      const response = await fetch(`/api/complaints/${task?.complaintId}/attachments`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch attachments");
      return response.json();
    },
    enabled: !!task?.complaintId,
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
  });

  // Fetch audit trail for the complaint
  const { data: auditTrail = [] } = useQuery({
    queryKey: ["/api/audit-trail", task?.complaintId],
    queryFn: async () => {
      const response = await fetch(`/api/audit-trail?complaintId=${task?.complaintId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch audit trail");
      return response.json();
    },
    enabled: !!task?.complaintId,
  });

  // Fetch all workflow tasks for this complaint (to show history)
  const { data: allWorkflowTasks = [] } = useQuery({
    queryKey: ["/api/workflow-tasks", "complaint", task?.complaintId],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-tasks?complaintId=${task?.complaintId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch workflow tasks");
      return response.json();
    },
    enabled: !!task?.complaintId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<WorkflowTask>) => {
      const response = await apiRequest("PUT", `/api/workflow-tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      onTaskUpdate?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (completionNotes: string) => {
      const response = await apiRequest("POST", `/api/workflow-tasks/${taskId}/complete`, {
        completionNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      toast({
        title: "Success",
        description: "Task completed successfully",
      });
      onTaskUpdate?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  const handleSubmitObservations = () => {
    if (!observations.trim()) {
      toast({
        title: "Error",
        description: "Please enter observations",
        variant: "destructive",
      });
      return;
    }

    if (!inspectionStatus) {
      toast({
        title: "Error",
        description: "Please select inspection status",
        variant: "destructive",
      });
      return;
    }

    const updates: Partial<WorkflowTask> = {
      observations,
      inspectionStatus,
      status: inspectionStatus === 'approved' ? 'completed' : 'in_progress',
    };

    if (inspectionStatus === 'forward') {
      if (!forwardEmail.trim()) {
        toast({
          title: "Error",
          description: "Please enter forward email",
          variant: "destructive",
        });
        return;
      }
      updates.forwardEmail = forwardEmail;
      updates.forwardReason = forwardReason;
      updates.status = 'forwarded';
    }

    updateTaskMutation.mutate(updates);
  };

  const handleCompleteTask = () => {
    const completionNotes = observations || "Task completed";
    completeTaskMutation.mutate(completionNotes);
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'INITIAL_INSPECTION':
      case 'SAFETY_INSPECTION':
        return <Eye className="h-5 w-5" />;
      case 'ASSESSMENT':
        return <Search className="h-5 w-5" />;
      case 'ENFORCEMENT_ACTION':
        return <Gavel className="h-5 w-5" />;
      case 'RESOLUTION':
        return <CheckCircle className="h-5 w-5" />;
      case 'REJECT_DEMOLITION':
        return <X className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: <Clock className="h-3 w-3" /> },
      in_progress: { variant: "default" as const, icon: <AlertTriangle className="h-3 w-3" /> },
      completed: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3" /> },
      approved: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { variant: "destructive" as const, icon: <X className="h-3 w-3" /> },
      forwarded: { variant: "secondary" as const, icon: <UserIcon className="h-3 w-3" /> },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status?.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "secondary" as const,
      medium: "default" as const,
      high: "destructive" as const,
      urgent: "destructive" as const,
    };
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || variants.medium}>
        {priority?.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Task not found</p>
        </CardContent>
      </Card>
    );
  }

  const assignedUser = users.find(u => u.id === task.assignedTo);
  const completedByUser = task.completedBy ? users.find(u => u.id === task.completedBy) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getTaskIcon(task.taskType)}
            <div>
              <CardTitle className="text-lg">{task.taskName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {task.taskType.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Task Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assigned To</Label>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm">
                {assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : task.assignedTo}
              </span>
              <Badge variant="outline">{task.assignedRole}</Badge>
            </div>
          </div>

          {task.dueDate && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Tabbed Content */}
        <Tabs defaultValue="complaint" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="complaint">
              <FileText className="h-4 w-4 mr-2" />
              Complaint Details
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Workflow History
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Eye className="h-4 w-4 mr-2" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Gavel className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Complaint Details Tab */}
          <TabsContent value="complaint" className="space-y-4">

        {/* Complaint/Notification Details Section */}
        {complaint && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Complaint Details - {complaint.complaintId}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Problem Type</Label>
                    <p className="text-sm font-medium">{complaint.problemType}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <div className="mt-1">
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{complaint.status}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reported Date</Label>
                    <p className="text-sm">{new Date(complaint.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contact Information</Label>
                    <div className="space-y-1">
                      <p className="text-sm">{complaint.contactName}</p>
                      <p className="text-sm text-muted-foreground">{complaint.contactEmail}</p>
                      <p className="text-sm text-muted-foreground">{complaint.contactPhone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <div className="space-y-1">
                      <p className="text-sm">{complaint.address}</p>
                      <p className="text-sm text-muted-foreground">{complaint.city}, {complaint.state} {complaint.zipCode}</p>
                      {complaint.latitude && complaint.longitude && (
                        <p className="text-xs text-muted-foreground">
                          Coordinates: {complaint.latitude}, {complaint.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
                </div>
              </div>
              
              {complaint.specificLocation && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Specific Location Details</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{complaint.specificLocation}</p>
                  </div>
                </div>
              )}
              
              {/* Attachments */}
              {attachments && attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Attachments ({attachments.length})</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {attachments.map((attachment: any) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/uploads/${attachment.filePath}`} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
          </TabsContent>

          {/* Workflow History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Workflow History
              </h3>
              
              {allWorkflowTasks && allWorkflowTasks.length > 0 ? (
                <div className="space-y-3">
                  {allWorkflowTasks
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((workflowTask: any) => {
                      const taskUser = users.find(u => u.id === workflowTask.assignedTo);
                      const completedUser = workflowTask.completedBy ? users.find(u => u.id === workflowTask.completedBy) : null;
                      
                      return (
                        <div key={workflowTask.id} className="border rounded-lg p-4 bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getTaskIcon(workflowTask.taskType)}
                              <div>
                                <h4 className="font-medium">{workflowTask.taskName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {workflowTask.taskType.replace(/_/g, " ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(workflowTask.status)}
                              {getPriorityBadge(workflowTask.priority)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Assigned to:</strong> {taskUser ? `${taskUser.firstName} ${taskUser.lastName}` : workflowTask.assignedTo}</p>
                              <p><strong>Created:</strong> {new Date(workflowTask.createdAt).toLocaleString()}</p>
                              {workflowTask.dueDate && (
                                <p><strong>Due:</strong> {new Date(workflowTask.dueDate).toLocaleString()}</p>
                              )}
                            </div>
                            <div>
                              {workflowTask.completedAt && (
                                <>
                                  <p><strong>Completed by:</strong> {completedUser ? `${completedUser.firstName} ${completedUser.lastName}` : workflowTask.completedBy}</p>
                                  <p><strong>Completed:</strong> {new Date(workflowTask.completedAt).toLocaleString()}</p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {workflowTask.observations && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground">Observations:</p>
                              <div className="mt-1 p-2 bg-muted rounded text-sm">
                                {workflowTask.observations}
                              </div>
                            </div>
                          )}
                          
                          {workflowTask.completionNotes && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground">Completion Notes:</p>
                              <div className="mt-1 p-2 bg-muted rounded text-sm">
                                {workflowTask.completionNotes}
                              </div>
                            </div>
                          )}
                          
                          {workflowTask.forwardEmail && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground">Forwarded to:</p>
                              <div className="mt-1 p-2 bg-muted rounded text-sm">
                                <p><strong>Email:</strong> {workflowTask.forwardEmail}</p>
                                {workflowTask.forwardReason && (
                                  <p><strong>Reason:</strong> {workflowTask.forwardReason}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No workflow history available
                </p>
              )}
            </div>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Audit Trail
              </h3>
              
              {auditTrail && auditTrail.length > 0 ? (
                <div className="space-y-3">
                  {auditTrail
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry: any, index: number) => {
                      const entryUser = users.find(u => u.id === entry.userId);
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 bg-card">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                {entryUser ? `${entryUser.firstName} ${entryUser.lastName}` : entry.userId}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {entry.action.replace(/_/g, " ").toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="text-sm">
                              {entry.newValue && (
                                <div className="p-2 bg-muted rounded">
                                  <p className="font-medium">Action:</p>
                                  <p>{entry.newValue}</p>
                                </div>
                              )}
                              
                              {entry.reason && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <p className="font-medium">Details:</p>
                                  <p>{entry.reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No audit trail available
                </p>
              )}
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Task Actions
              </h3>

              {/* Current Task Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                  {task.observations && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <strong>Observations:</strong> {task.observations}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Forward Information */}
              {task.forwardEmail && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Forward Information</Label>
                  <div className="p-3 bg-muted rounded-md space-y-2">
                    <p className="text-sm"><strong>Email:</strong> {task.forwardEmail}</p>
                    {task.forwardReason && (
                      <p className="text-sm"><strong>Reason:</strong> {task.forwardReason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Section - Only show if task is not completed */}
              {task.status !== 'completed' && (
                <div className="space-y-4">
                  <Separator />
                  
                  {/* Observations Input */}
                  <div className="space-y-2">
                    <Label htmlFor="observations">
                      Inspection Observations <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="observations"
                      placeholder="Enter your inspection observations..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Inspection Status */}
                  <div className="space-y-2">
                    <Label>
                      Inspection Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={inspectionStatus} onValueChange={setInspectionStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inspection status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="forward">Forward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Forward Fields - Only show if status is forward */}
                  {inspectionStatus === 'forward' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forwardEmail">
                          Forward Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="forwardEmail"
                          type="email"
                          placeholder="Enter email to forward to"
                          value={forwardEmail}
                          onChange={(e) => setForwardEmail(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="forwardReason">Forward Reason</Label>
                        <Textarea
                          id="forwardReason"
                          placeholder="Reason for forwarding (optional)"
                          value={forwardReason}
                          onChange={(e) => setForwardReason(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitObservations}
                      disabled={updateTaskMutation.isPending}
                      className="flex-1"
                    >
                      {updateTaskMutation.isPending ? "Updating..." : "Submit Observations"}
                    </Button>
                    
                    {inspectionStatus === 'approved' && (
                      <Button
                        onClick={handleCompleteTask}
                        disabled={completeTaskMutation.isPending}
                        variant="default"
                      >
                        {completeTaskMutation.isPending ? "Completing..." : "Complete Task"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Completion Information */}
              {task.status === 'completed' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Completion Information</Label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
                    <p className="text-sm">
                      <strong>Completed by:</strong> {completedByUser ? `${completedByUser.firstName} ${completedByUser.lastName}` : task.completedBy}
                    </p>
                    {task.completedAt && (
                      <p className="text-sm">
                        <strong>Completed on:</strong> {new Date(task.completedAt).toLocaleString()}
                      </p>
                    )}
                    {task.completionNotes && (
                      <p className="text-sm">
                        <strong>Notes:</strong> {task.completionNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}