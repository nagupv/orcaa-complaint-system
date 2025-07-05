import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { InboxItem, WorkflowTask, Complaint, LeaveRequest, OvertimeRequest } from "@shared/schema";
import { CheckCircle, Clock, AlertTriangle, User, CalendarDays, Briefcase, CheckSquare, XSquare, Eye, Search, Gavel, Shield, X, FileText, Mail, MessageSquare } from "lucide-react";
import WorkflowTaskDetail from "@/components/WorkflowTaskDetail";
import { formatDistanceToNow, format } from "date-fns";

export default function EnhancedInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch inbox items
  const { data: inboxItems = [], isLoading: inboxLoading } = useQuery({
    queryKey: ["/api/inbox"],
    queryFn: async () => {
      const response = await fetch("/api/inbox", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch inbox items");
      return response.json() as Promise<InboxItem[]>;
    },
    enabled: !!user,
  });

  // Fetch workflow tasks assigned to user
  const { data: workflowTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/workflow-tasks", { assignedTo: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-tasks?assignedTo=${user?.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch workflow tasks");
      return response.json() as Promise<WorkflowTask[]>;
    },
    enabled: !!user?.id,
  });

  // Fetch complaints for context
  const { data: complaints = [] } = useQuery({
    queryKey: ["/api/complaints"],
  });

  // Fetch leave requests for approval
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["/api/leave-requests"],
  });

  // Fetch overtime requests for approval
  const { data: overtimeRequests = [] } = useQuery({
    queryKey: ["/api/overtime-requests"],
  });

  // Mark inbox item as read
  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/inbox/${id}/mark-read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
    },
  });

  // Approve leave request
  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/leave-requests/${id}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });
    },
  });

  // Reject leave request
  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/leave-requests/${id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request rejected",
      });
    },
  });

  // Approve overtime request
  const approveOvertimeRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/overtime-requests/${id}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      toast({
        title: "Success",
        description: "Overtime request approved successfully",
      });
    },
  });

  // Reject overtime request
  const rejectOvertimeRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/overtime-requests/${id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      toast({
        title: "Success",
        description: "Overtime request rejected",
      });
    },
  });

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'INITIAL_INSPECTION':
      case 'SAFETY_INSPECTION':
        return <Eye className="h-4 w-4" />;
      case 'ASSESSMENT':
        return <Search className="h-4 w-4" />;
      case 'ENFORCEMENT_ACTION':
        return <Gavel className="h-4 w-4" />;
      case 'RESOLUTION':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECT_DEMOLITION':
        return <X className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: <Clock className="h-3 w-3" /> },
      in_progress: { variant: "default" as const, icon: <AlertTriangle className="h-3 w-3" /> },
      completed: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3" /> },
      approved: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { variant: "destructive" as const, icon: <X className="h-3 w-3" /> },
      forwarded: { variant: "secondary" as const, icon: <MessageSquare className="h-3 w-3" /> },
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

  const handleItemClick = (item: InboxItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }

    if (item.itemType === 'WORKFLOW_TASK' && item.workflowTaskId) {
      setSelectedTask(item.workflowTaskId);
    } else if (item.itemType === 'COMPLAINT' && item.complaintId) {
      setSelectedComplaint(item.complaintId);
    }
  };

  const handleTaskClick = (taskId: number) => {
    setSelectedTask(taskId);
  };

  const handleTaskUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/workflow-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
    setSelectedTask(null);
  };

  // Filter data based on active tab
  const filteredWorkflowTasks = workflowTasks.filter(task => {
    if (activeTab === "all") return true;
    if (activeTab === "tasks") return true;
    return false;
  });

  const pendingApprovals = [
    ...leaveRequests.filter(req => req.status === 'pending'),
    ...overtimeRequests.filter(req => req.status === 'pending')
  ];

  const myRequests = [
    ...leaveRequests.filter(req => req.userId === user?.id),
    ...overtimeRequests.filter(req => req.userId === user?.id)
  ];

  // Check if user can approve requests
  const userRoles = user?.roles ? (typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles) : [];
  const canApprove = userRoles.some((role: string) => ['admin', 'supervisor', 'approver'].includes(role));

  const unreadCount = inboxItems.filter(item => !item.isRead).length;
  const pendingTasksCount = workflowTasks.filter(task => task.status === 'pending').length;
  const approvalsCount = canApprove ? pendingApprovals.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inbox</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="relative">
            All Items
            {(unreadCount + pendingTasksCount) > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount + pendingTasksCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="relative">
            Workflow Tasks
            {pendingTasksCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingTasksCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {approvalsCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {approvalsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            My Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Inbox Items</CardTitle>
            </CardHeader>
            <CardContent>
              {inboxLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : inboxItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items in your inbox
                </p>
              ) : (
                <div className="space-y-3">
                  {inboxItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        !item.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${!item.isRead ? 'font-semibold' : ''}`}>
                              {item.title}
                            </h3>
                            {!item.isRead && <Badge variant="destructive" className="text-xs">New</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{item.itemType}</Badge>
                            {getPriorityBadge(item.priority)}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredWorkflowTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No workflow tasks assigned to you
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredWorkflowTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getTaskIcon(task.taskType)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{task.taskName}</h3>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.taskType.replace(/_/g, " ")}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">Complaint #{task.complaintId}</Badge>
                              <Badge variant="outline">{task.assignedRole}</Badge>
                              {task.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {canApprove ? (
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending approvals
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((request) => (
                        <TableRow key={`${request.id}-${'leaveType' in request ? 'leave' : 'overtime'}`}>
                          <TableCell>
                            <Badge variant="outline">
                              {'leaveType' in request ? 'Leave' : 'Overtime'}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.userId}</TableCell>
                          <TableCell>
                            {'leaveType' in request ? (
                              <div>
                                <p className="font-medium">{(request as LeaveRequest).leaveType}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date((request as LeaveRequest).startDate), 'MMM dd')} - 
                                  {format(new Date((request as LeaveRequest).endDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">{(request as OvertimeRequest).totalHours} hours</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date((request as OvertimeRequest).date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if ('leaveType' in request) {
                                    approveLeaveRequestMutation.mutate(request.id);
                                  } else {
                                    approveOvertimeRequestMutation.mutate(request.id);
                                  }
                                }}
                                disabled={approveLeaveRequestMutation.isPending || approveOvertimeRequestMutation.isPending}
                              >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const reason = prompt("Enter rejection reason:");
                                  if (reason) {
                                    if ('leaveType' in request) {
                                      rejectLeaveRequestMutation.mutate({ id: request.id, reason });
                                    } else {
                                      rejectOvertimeRequestMutation.mutate({ id: request.id, reason });
                                    }
                                  }
                                }}
                                disabled={rejectLeaveRequestMutation.isPending || rejectOvertimeRequestMutation.isPending}
                              >
                                <XSquare className="h-4 w-4 mr-1" />
                                Reject
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
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  You don't have permission to approve requests
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No requests found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map((request) => (
                      <TableRow key={`${request.id}-${'leaveType' in request ? 'leave' : 'overtime'}`}>
                        <TableCell>
                          <Badge variant="outline">
                            {'leaveType' in request ? 'Leave' : 'Overtime'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {'leaveType' in request ? (
                            <div>
                              <p className="font-medium">{(request as LeaveRequest).leaveType}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date((request as LeaveRequest).startDate), 'MMM dd')} - 
                                {format(new Date((request as LeaveRequest).endDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">{(request as OvertimeRequest).totalHours} hours</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date((request as OvertimeRequest).date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Task Detail Dialog */}
      <Dialog open={selectedTask !== null} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <WorkflowTaskDetail
              taskId={selectedTask}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}