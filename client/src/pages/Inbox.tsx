import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Calendar, DollarSign, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

export default function Inbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

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

  const approveLeaveRequest = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/leave-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });
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
        description: "Failed to approve leave request",
        variant: "destructive",
      });
    },
  });

  const rejectLeaveRequest = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/leave-requests/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request rejected",
      });
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
        description: "Failed to reject leave request",
        variant: "destructive",
      });
    },
  });

  const approveOvertimeRequest = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/overtime-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      toast({
        title: "Success",
        description: "Overtime request approved successfully",
      });
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
        description: "Failed to approve overtime request",
        variant: "destructive",
      });
    },
  });

  const rejectOvertimeRequest = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/overtime-requests/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      toast({
        title: "Success",
        description: "Overtime request rejected",
      });
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
        description: "Failed to reject overtime request",
        variant: "destructive",
      });
    },
  });

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
    ...complaints.map((complaint: any) => ({
      ...complaint,
      type: "complaint",
      title: `${complaint.complaintId} - ${complaint.problemType}`,
      description: complaint.description,
      priority: complaint.priority,
      status: complaint.status,
      createdAt: complaint.createdAt,
    })),
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
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredItems = activeTab === "all" ? allItems : allItems.filter(item => {
    switch (activeTab) {
      case "complaints":
        return item.type === "complaint";
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

  const isLoading = complaintsLoading || leaveLoading || overtimeLoading || myLeaveLoading || myOvertimeLoading;

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
                          {(item.type === "leave_approval" || item.type === "overtime_approval") && item.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (item.type === "leave_approval") {
                                    approveLeaveRequest.mutate(item.id);
                                  } else {
                                    approveOvertimeRequest.mutate(item.id);
                                  }
                                }}
                                disabled={approveLeaveRequest.isPending || approveOvertimeRequest.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (item.type === "leave_approval") {
                                    rejectLeaveRequest.mutate(item.id);
                                  } else {
                                    rejectOvertimeRequest.mutate(item.id);
                                  }
                                }}
                                disabled={rejectLeaveRequest.isPending || rejectOvertimeRequest.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}