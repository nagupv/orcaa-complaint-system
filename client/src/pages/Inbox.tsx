import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Calendar, DollarSign, Bell, Eye, MessageSquare, Forward, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow, format } from "date-fns";

export default function Inbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "forward">("approve");
  const [comments, setComments] = useState("");
  const [forwardEmail, setForwardEmail] = useState("");

  // Fetch assigned complaints
  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints", { assignedTo: user?.id }],
    enabled: !!user?.id,
  });

  // Fetch leave requests for approval
  const { data: leaveRequests = [], isLoading: leaveLoading } = useQuery({
    queryKey: ["/api/leave-requests", { status: "pending" }],
    enabled: !!user?.roles?.some((role: string) => ["admin", "supervisor", "approver"].includes(role)),
  });

  // Fetch overtime requests for approval
  const { data: overtimeRequests = [], isLoading: overtimeLoading } = useQuery({
    queryKey: ["/api/overtime-requests", { status: "pending" }],
    enabled: !!user?.roles?.some((role: string) => ["admin", "supervisor", "approver"].includes(role)),
  });

  // Fetch user's own leave/overtime requests
  const { data: myLeaveRequests = [], isLoading: myLeaveLoading } = useQuery({
    queryKey: ["/api/leave-requests", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const { data: myOvertimeRequests = [], isLoading: myOvertimeLoading } = useQuery({
    queryKey: ["/api/overtime-requests", { userId: user?.id }],
    enabled: !!user?.id,
  });

  // Fetch all users for forwarding
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user?.roles?.some((role: string) => ["admin", "supervisor", "approver"].includes(role)),
  });

  // Fetch workflows for complaint workflow information
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
    enabled: !!user?.id,
  });

  // Fetch workflow tasks to get current steps
  const { data: workflowTasks = [], isLoading: workflowTasksLoading } = useQuery({
    queryKey: ["/api/workflow-tasks"],
    enabled: !!user?.id,
  });

  const processItemAction = useMutation({
    mutationFn: async (params: { 
      item: any; 
      action: "approve" | "reject" | "forward"; 
      comments?: string; 
      forwardEmail?: string 
    }) => {
      const { item, action, comments, forwardEmail } = params;
      
      if (action === "forward") {
        // Handle forwarding logic
        const endpoint = item.type === "complaint" 
          ? `/api/complaints/${item.id}/forward`
          : item.type === "leave_approval" || item.type === "my_leave"
          ? `/api/leave-requests/${item.id}/forward`
          : `/api/overtime-requests/${item.id}/forward`;
        
        await apiRequest("POST", endpoint, { 
          forwardTo: forwardEmail,
          comments: comments || "",
        });
      } else {
        // Handle approve/reject
        let endpoint = "";
        if (item.type === "leave_approval") {
          endpoint = `/api/leave-requests/${item.id}/${action}`;
        } else if (item.type === "overtime_approval") {
          endpoint = `/api/overtime-requests/${item.id}/${action}`;
        } else if (item.type === "complaint") {
          endpoint = `/api/complaints/${item.id}/${action}`;
        } else if (item.type === "workflow_task") {
          endpoint = `/api/workflow-tasks/${item.id}/${action}`;
        }
        
        await apiRequest("POST", endpoint, { 
          reason: comments || "",
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-tasks"] });
      
      const actionText = variables.action === "forward" 
        ? `forwarded to ${variables.forwardEmail}`
        : `${variables.action}d successfully`;
      
      toast({
        title: "Success",
        description: `Item ${actionText}`,
      });
      
      setActionDialogOpen(false);
      setComments("");
      setForwardEmail("");
      setSelectedItem(null);
    },
    onError: (error) => {
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
        description: "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const handleItemAction = (item: any, action: "approve" | "reject" | "forward") => {
    setSelectedItem(item);
    setActionType(action);
    setActionDialogOpen(true);
    setComments("");
    setForwardEmail("");
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setViewDetailsOpen(true);
  };

  const submitAction = () => {
    if (!selectedItem) return;
    
    if (actionType === "forward" && !forwardEmail) {
      toast({
        title: "Error",
        description: "Please select an employee to forward to",
        variant: "destructive",
      });
      return;
    }

    processItemAction.mutate({
      item: selectedItem,
      action: actionType,
      comments,
      forwardEmail,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "initiated":
        return "bg-blue-500";
      case "in_progress":
        return "bg-orange-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const isApprover = user?.roles?.some((role: string) => ["admin", "supervisor", "approver"].includes(role));

  const allItems = [
    ...complaints.map((complaint: any) => {
      const workflow = workflows.find((w: any) => w.id === complaint.workflowId);
      const description = complaint.description || 'No description provided';
      // Handle problemTypes array or use status as fallback
      const problemTypeText = complaint.problemTypes && Array.isArray(complaint.problemTypes) 
        ? complaint.problemTypes.join(', ') 
        : complaint.status || 'Unknown';
      
      // Find current workflow step (active/pending task)
      const currentTask = workflowTasks.find((task: any) => 
        task.complaintId === complaint.id && 
        (task.status === 'pending' || task.status === 'in_progress')
      );
      const currentStep = currentTask ? currentTask.taskName : 'No Active Step';
      
      return {
        ...complaint,
        type: "complaint",
        title: `${complaint.complaintId} - ${problemTypeText}`,
        description: `${description}${workflow ? ` | Workflow: ${workflow.name}` : ''}${currentStep ? ` | Step: ${currentStep}` : ''}`,
        priority: complaint.priority,
        status: complaint.status,
        createdAt: complaint.createdAt,
        workflowName: workflow?.name || 'No Workflow Assigned',
        problemType: problemTypeText, // For the detail view
        currentStep: currentStep, // For the detail view
      };
    }),
    ...leaveRequests.map((request: any) => ({
      ...request,
      type: "leave_approval",
      title: `Leave Request - ${request.leaveType}`,
      description: `${request.startDate} to ${request.endDate}`,
      priority: "normal",
      status: request.status,
      createdAt: request.createdAt,
    })),
    ...overtimeRequests.map((request: any) => ({
      ...request,
      type: "overtime_approval",
      title: `Overtime Request - ${request.projectName}`,
      description: `${request.hours} hours on ${request.date}`,
      priority: "normal",
      status: request.status,
      createdAt: request.createdAt,
    })),
    ...myLeaveRequests.map((request: any) => ({
      ...request,
      type: "my_leave",
      title: `My Leave Request - ${request.leaveType}`,
      description: `${request.startDate} to ${request.endDate}`,
      priority: "normal",
      status: request.status,
      createdAt: request.createdAt,
    })),
    ...myOvertimeRequests.map((request: any) => ({
      ...request,
      type: "my_overtime",
      title: `My Overtime Request - ${request.projectName}`,
      description: `${request.hours} hours on ${request.date}`,
      priority: "normal",
      status: request.status,
      createdAt: request.createdAt,
    })),
    // Add workflow tasks as actionable items - only show current pending tasks per complaint
    ...(() => {
      const userTasks = workflowTasks.filter((task: any) => task.assignedTo === user?.id && task.status === 'pending');
      console.log('User tasks before filtering:', userTasks.map((t: any) => ({id: t.id, complaintId: t.complaintId, status: t.status})));
      
      const uniqueTasks = userTasks.reduce((uniqueTasks: any[], task: any) => {
        // Only keep the HIGHEST ID (most recent) task per complaint for this user
        const existingTaskIndex = uniqueTasks.findIndex(t => t.complaintId === task.complaintId);
        if (existingTaskIndex === -1) {
          uniqueTasks.push(task);
        } else {
          // Keep the task with the higher ID (more recent)
          if (task.id > uniqueTasks[existingTaskIndex].id) {
            uniqueTasks[existingTaskIndex] = task;
          }
        }
        return uniqueTasks;
      }, []);
      
      console.log('Unique tasks after filtering:', uniqueTasks.map((t: any) => ({id: t.id, complaintId: t.complaintId, status: t.status})));
      return uniqueTasks;
    })()
      .map((task: any) => {
        const complaint = complaints.find((c: any) => c.id === task.complaintId);
        const workflow = workflows.find((w: any) => w.id === task.workflowId);
        return {
          ...task,
          type: "workflow_task",
          title: `${task.taskName} - ${complaint?.complaintId || 'Unknown'}`,
          description: `${task.taskType.replace(/_/g, ' ')} for complaint ${complaint?.complaintId || 'Unknown'}${workflow ? ` | Workflow: ${workflow.name}` : ''}`,
          priority: task.priority || "medium",
          status: task.status,
          createdAt: task.createdAt,
          complaintId: task.complaintId,
          workflowTaskId: task.id,
        };
      }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredItems = activeTab === "all" ? allItems : allItems.filter(item => {
    switch (activeTab) {
      case "complaints":
        return item.type === "complaint" || item.type === "workflow_task";
      case "approvals":
        return item.type === "leave_approval" || item.type === "overtime_approval";
      case "requests":
        return item.type === "my_leave" || item.type === "my_overtime";
      default:
        return true;
    }
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case "complaint":
        return <FileText className="h-4 w-4" />;
      case "workflow_task":
        return <GitBranch className="h-4 w-4" />;
      case "leave_approval":
      case "my_leave":
        return <Calendar className="h-4 w-4" />;
      case "overtime_approval":
      case "my_overtime":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const isLoading = complaintsLoading || leaveLoading || overtimeLoading || myLeaveLoading || myOvertimeLoading || workflowsLoading;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-orcaa-blue flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Inbox
            </CardTitle>
            <p className="text-gray-600">
              All work items assigned to you and pending approvals
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex w-full flex-wrap gap-1 mb-6">
                <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  All Items ({allItems.length})
                </TabsTrigger>
                <TabsTrigger value="complaints" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  Complaints ({complaints.length})
                </TabsTrigger>
                {isApprover && (
                  <TabsTrigger value="approvals" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                    Approvals ({leaveRequests.length + overtimeRequests.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="requests" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  My Requests ({myLeaveRequests.length + myOvertimeRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-orcaa-blue" />
                      <p className="text-gray-600">Loading inbox items...</p>
                    </div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No items in your inbox</p>
                  </div>
                ) : activeTab === "all" ? (
                  <>
                    {/* Pending/Ongoing Items Section */}
                    {(() => {
                      const pendingOngoingItems = filteredItems.filter(item => 
                        item.status === "pending" || item.status === "in_progress" || item.status === "initiated"
                      );
                      
                      return pendingOngoingItems.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Pending / Ongoing Items ({pendingOngoingItems.length})</h3>
                          </div>
                          {pendingOngoingItems.map((item) => (
                            <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="flex items-center gap-2">
                                      {getItemIcon(item.type)}
                                      <div className="flex items-center gap-2">
                                        <Badge className={`${getStatusColor(item.status)} text-white`}>
                                          {item.status}
                                        </Badge>
                                        {item.priority && (
                                          <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                                            {item.priority}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDetails(item)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    {(item.type === "leave_approval" || item.type === "overtime_approval" || item.type === "complaint" || item.type === "workflow_task") && item.status === "pending" && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleItemAction(item, "approve")}
                                          disabled={processItemAction.isPending}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleItemAction(item, "reject")}
                                          disabled={processItemAction.isPending}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Reject
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleItemAction(item, "forward")}
                                          disabled={processItemAction.isPending}
                                        >
                                          <Forward className="h-4 w-4 mr-1" />
                                          Forward
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Remaining Items Section */}
                    {(() => {
                      const remainingItems = filteredItems.filter(item => 
                        item.status !== "pending" && item.status !== "in_progress" && item.status !== "initiated"
                      );
                      
                      return remainingItems.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Other Items ({remainingItems.length})</h3>
                          </div>
                          {remainingItems.map((item) => (
                            <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="flex items-center gap-2">
                                      {getItemIcon(item.type)}
                                      <div className="flex items-center gap-2">
                                        <Badge className={`${getStatusColor(item.status)} text-white`}>
                                          {item.status}
                                        </Badge>
                                        {item.priority && (
                                          <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                                            {item.priority}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDetails(item)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    {(item.type === "leave_approval" || item.type === "overtime_approval" || item.type === "complaint" || item.type === "workflow_task") && item.status === "pending" && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleItemAction(item, "approve")}
                                          disabled={processItemAction.isPending}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleItemAction(item, "reject")}
                                          disabled={processItemAction.isPending}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Reject
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleItemAction(item, "forward")}
                                          disabled={processItemAction.isPending}
                                        >
                                          <Forward className="h-4 w-4 mr-1" />
                                          Forward
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  filteredItems.map((item) => (
                    <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.type)}
                              <div className="flex items-center gap-2">
                                <Badge className={`${getStatusColor(item.status)} text-white`}>
                                  {item.status}
                                </Badge>
                                {item.priority && (
                                  <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                                    {item.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {(item.type === "leave_approval" || item.type === "overtime_approval" || item.type === "complaint" || item.type === "workflow_task") && item.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleItemAction(item, "approve")}
                                  disabled={processItemAction.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleItemAction(item, "reject")}
                                  disabled={processItemAction.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleItemAction(item, "forward")}
                                  disabled={processItemAction.isPending}
                                >
                                  <Forward className="h-4 w-4 mr-1" />
                                  Forward
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Item Details</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Type</Label>
                    <p className="text-sm text-gray-600">{selectedItem.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <Badge className={`${getStatusColor(selectedItem.status)} text-white ml-2`}>
                      {selectedItem.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Created</Label>
                    <p className="text-sm text-gray-600">
                      {format(new Date(selectedItem.createdAt), 'PPp')}
                    </p>
                  </div>
                  {selectedItem.priority && (
                    <div>
                      <Label className="font-semibold">Priority</Label>
                      <Badge className={`${getPriorityColor(selectedItem.priority)} text-white ml-2`}>
                        {selectedItem.priority}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                </div>

                {/* Type-specific details */}
                {selectedItem.type === "complaint" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Complaint ID</Label>
                        <p className="text-sm text-gray-600">{selectedItem.complaintId}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Problem Type</Label>
                        <p className="text-sm text-gray-600">{selectedItem.problemType}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Current Workflow</Label>
                        <p className="text-sm text-gray-600">{selectedItem.workflowName || 'No Workflow Assigned'}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Current Step</Label>
                        <p className="text-sm text-gray-600">{selectedItem.currentStep || 'No Active Step'}</p>
                      </div>
                      {selectedItem.assignedTo && (
                        <div>
                          <Label className="font-semibold">Assigned To</Label>
                          <p className="text-sm text-gray-600">{selectedItem.assignedTo}</p>
                        </div>
                      )}
                    </div>
                    {selectedItem.complainantEmail && (
                      <div>
                        <Label className="font-semibold">Complainant</Label>
                        <p className="text-sm text-gray-600">{selectedItem.complainantEmail}</p>
                      </div>
                    )}
                  </>
                )}

                {(selectedItem.type === "leave_approval" || selectedItem.type === "my_leave") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Leave Type</Label>
                      <p className="text-sm text-gray-600">{selectedItem.leaveType}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Duration</Label>
                      <p className="text-sm text-gray-600">
                        {selectedItem.startDate} to {selectedItem.endDate}
                      </p>
                    </div>
                  </div>
                )}

                {(selectedItem.type === "overtime_approval" || selectedItem.type === "my_overtime") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Project</Label>
                      <p className="text-sm text-gray-600">{selectedItem.projectName}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Hours</Label>
                      <p className="text-sm text-gray-600">{selectedItem.hours} hours</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Approve" : actionType === "reject" ? "Reject" : "Forward"} Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedItem && (
                <div>
                  <Label className="font-semibold">Item</Label>
                  <p className="text-sm text-gray-600">{selectedItem.title}</p>
                </div>
              )}

              <div>
                <Label htmlFor="action-select">Action</Label>
                <Select value={actionType} onValueChange={(value: "approve" | "reject" | "forward") => setActionType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {actionType === "forward" && (
                <div>
                  <Label htmlFor="forward-email">Forward to Employee</Label>
                  <Select value={forwardEmail} onValueChange={setForwardEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.map((user: any) => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="comments">
                  Comments {actionType === "reject" ? "(Required for rejection)" : "(Optional)"}
                </Label>
                <Textarea
                  id="comments"
                  placeholder={`Add ${actionType === "forward" ? "forwarding notes" : "comments"}...`}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitAction}
                  disabled={processItemAction.isPending || (actionType === "reject" && !comments.trim())}
                >
                  {processItemAction.isPending ? "Processing..." : actionType === "approve" ? "Approve" : actionType === "reject" ? "Reject" : "Forward"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}