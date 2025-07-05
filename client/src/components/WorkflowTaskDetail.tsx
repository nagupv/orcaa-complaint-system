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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WorkflowTask, User } from "@shared/schema";
import { CheckCircle, Clock, AlertTriangle, User as UserIcon, Calendar, Eye, Search, Gavel, Shield, X } from "lucide-react";

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

        {/* Current Observations */}
        {task.observations && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Observations</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{task.observations}</p>
            </div>
          </div>
        )}

        {/* Current Status Details */}
        {task.inspectionStatus && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Inspection Status</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm capitalize">{task.inspectionStatus}</p>
            </div>
          </div>
        )}

        {/* Forward Information */}
        {task.forwardEmail && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Forwarded To</Label>
            <div className="p-3 bg-muted rounded-md space-y-2">
              <p className="text-sm"><strong>Email:</strong> {task.forwardEmail}</p>
              {task.forwardReason && (
                <p className="text-sm"><strong>Reason:</strong> {task.forwardReason}</p>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Action Section - Only show if task is not completed */}
        {task.status !== 'completed' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Task Actions</h3>
            
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
      </CardContent>
    </Card>
  );
}