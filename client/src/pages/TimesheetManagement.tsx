import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Plus, Edit, Trash2, User, FileText, Plane, AlertCircle, Check, X, Calendar1, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Timesheet, InsertTimesheet, LeaveRequest, InsertLeaveRequest, OvertimeRequest, InsertOvertimeRequest } from "@shared/schema";

const timesheetFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  activity: z.string().min(1, "Activity is required"),
  comments: z.string().optional(),
  businessWorkId: z.string().optional(),
  timeInHours: z.coerce.number().min(0.25, "Minimum 0.25 hours required").max(24, "Maximum 24 hours per entry"),
});

type TimesheetFormData = z.infer<typeof timesheetFormSchema>;

// Leave request form schema
const leaveRequestFormSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestFormSchema>;

// Overtime request form schema
const overtimeRequestFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  hours: z.number().min(0.5, "Hours must be at least 0.5").max(12, "Hours cannot exceed 12"),
  reason: z.string().min(1, "Reason is required"),
  projectDescription: z.string().optional(),
});

type OvertimeRequestFormData = z.infer<typeof overtimeRequestFormSchema>;

export default function TimesheetManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [activeTab, setActiveTab] = useState("time-entries");
  const [editingLeaveRequest, setEditingLeaveRequest] = useState<any | null>(null);
  const [editingOvertimeRequest, setEditingOvertimeRequest] = useState<any | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Get current week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, so we need -6 to get previous Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return monday.toISOString().split('T')[0];
  });

  // Get today's date for default value
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: {
      date: today,
      activity: "",
      comments: "",
      businessWorkId: "none",
      timeInHours: 8,
    },
  });

  // Leave request form
  const leaveForm = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: {
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  // Overtime request form
  const overtimeForm = useForm<OvertimeRequestFormData>({
    resolver: zodResolver(overtimeRequestFormSchema),
    defaultValues: {
      date: today,
      hours: 0,
      reason: "",
      projectDescription: "",
    },
  });

  // Fetch timesheets for current user
  const { data: timesheets = [], isLoading: timesheetsLoading } = useQuery({
    queryKey: ["/api/timesheets", user?.id],
    enabled: !!user?.id,
  });

  // Fetch available activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/timesheet-activities"],
  });

  // Fetch valid complaint IDs
  const { data: validComplaintIds = [], isLoading: complaintIdsLoading } = useQuery({
    queryKey: ["/api/valid-complaint-ids"],
  });

  // Fetch leave requests
  const { data: leaveRequests = [], isLoading: leaveRequestsLoading } = useQuery({
    queryKey: ["/api/leave-requests"],
  });

  // Fetch overtime requests
  const { data: overtimeRequests = [], isLoading: overtimeRequestsLoading } = useQuery({
    queryKey: ["/api/overtime-requests"],
  });

  // Create timesheet mutation
  const createMutation = useMutation({
    mutationFn: async (data: TimesheetFormData) => {
      const timesheetData: InsertTimesheet = {
        ...data,
        userId: user!.id,
        timeInHours: data.timeInHours.toString(),
      };
      return await apiRequest("POST", "/api/timesheets", timesheetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Success",
        description: "Timesheet entry created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset({
        date: today,
        activity: "",
        comments: "",
        businessWorkId: "none",
        timeInHours: 8,
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
        description: "Failed to create timesheet entry",
        variant: "destructive",
      });
    },
  });

  // Update timesheet mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TimesheetFormData }) => {
      const timesheetData = {
        ...data,
        timeInHours: data.timeInHours.toString(),
      };
      return await apiRequest("PUT", `/api/timesheets/${id}`, timesheetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Success",
        description: "Timesheet entry updated successfully",
      });
      setEditingTimesheet(null);
      form.reset({
        date: today,
        activity: "",
        comments: "",
        businessWorkId: "none",
        timeInHours: 8,
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
        description: "Failed to update timesheet entry",
        variant: "destructive",
      });
    },
  });

  // Delete timesheet mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Success",
        description: "Timesheet entry deleted successfully",
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
        description: "Failed to delete timesheet entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TimesheetFormData) => {
    // Convert "none" back to empty string for database storage
    const processedData = {
      ...data,
      businessWorkId: data.businessWorkId === "none" ? "" : data.businessWorkId,
    };
    
    if (editingTimesheet) {
      updateMutation.mutate({ id: editingTimesheet.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    form.reset({
      date: timesheet.date,
      activity: timesheet.activity,
      comments: timesheet.comments || "",
      businessWorkId: timesheet.businessWorkId || "none",
      timeInHours: parseFloat(timesheet.timeInHours),
    });
    setIsCreateDialogOpen(true);
  };

  // Leave request mutations
  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: LeaveRequestFormData) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      const requestData = {
        ...data,
        totalDays: totalDays.toString(),
      };
      return await apiRequest("POST", "/api/leave-requests", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      leaveForm.reset();
      setIsLeaveDialogOpen(false);
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
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
        description: "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/leave-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });
    },
  });

  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest("POST", `/api/leave-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request rejected",
      });
    },
  });

  // Overtime request mutations
  const createOvertimeRequestMutation = useMutation({
    mutationFn: async (data: OvertimeRequestFormData) => {
      const requestData = {
        ...data,
        date: data.date,
        startTime: "18:00",
        endTime: "20:00",
        totalHours: data.hours.toString(),
        businessWorkId: data.projectDescription || null,
      };
      return await apiRequest("POST", "/api/overtime-requests", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      overtimeForm.reset();
      setIsOvertimeDialogOpen(false);
      toast({
        title: "Success",
        description: "Overtime request submitted successfully",
      });
    },
  });

  const approveOvertimeRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/overtime-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      toast({
        title: "Success",
        description: "Overtime request approved successfully",
      });
    },
  });

  const rejectOvertimeRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest("POST", `/api/overtime-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      toast({
        title: "Success",
        description: "Overtime request rejected",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this timesheet entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatHours = (hours: string) => {
    const num = parseFloat(hours);
    return `${num} hour${num !== 1 ? 's' : ''}`;
  };

  // Calculate total hours for current month
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentMonthTimesheets = timesheets.filter((ts: Timesheet) => 
    ts.date.startsWith(currentMonth)
  );
  const totalHoursThisMonth = currentMonthTimesheets.reduce((sum: number, ts: Timesheet) => 
    sum + parseFloat(ts.timeInHours), 0
  );

  // Calculate summaries by day and activity
  const dailyActivitySummary = timesheets.reduce((acc: any, ts: Timesheet) => {
    const date = ts.date;
    const activity = ts.activity;
    const hours = parseFloat(ts.timeInHours);
    
    if (!acc[date]) acc[date] = {};
    if (!acc[date][activity]) acc[date][activity] = 0;
    acc[date][activity] += hours;
    
    return acc;
  }, {});

  // Calculate summaries by day and work ID
  const dailyWorkIdSummary = timesheets.reduce((acc: any, ts: Timesheet) => {
    const date = ts.date;
    const workId = ts.businessWorkId || 'No Work ID';
    const hours = parseFloat(ts.timeInHours);
    
    if (!acc[date]) acc[date] = {};
    if (!acc[date][workId]) acc[date][workId] = 0;
    acc[date][workId] += hours;
    
    return acc;
  }, {});

  // Calculate weekly summaries
  const getWeekStart = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const weeklyActivitySummary = timesheets.reduce((acc: any, ts: Timesheet) => {
    const weekStart = getWeekStart(ts.date);
    const activity = ts.activity;
    const hours = parseFloat(ts.timeInHours);
    
    if (!acc[weekStart]) acc[weekStart] = {};
    if (!acc[weekStart][activity]) acc[weekStart][activity] = 0;
    acc[weekStart][activity] += hours;
    
    return acc;
  }, {});

  const weeklyWorkIdSummary = timesheets.reduce((acc: any, ts: Timesheet) => {
    const weekStart = getWeekStart(ts.date);
    const workId = ts.businessWorkId || 'No Work ID';
    const hours = parseFloat(ts.timeInHours);
    
    if (!acc[weekStart]) acc[weekStart] = {};
    if (!acc[weekStart][workId]) acc[weekStart][workId] = 0;
    acc[weekStart][workId] += hours;
    
    return acc;
  }, {});

  // Get unique activities and work IDs for table headers
  const allActivities = [...new Set(timesheets.map((ts: Timesheet) => ts.activity))];
  const allWorkIds = [...new Set(timesheets.map((ts: Timesheet) => ts.businessWorkId || 'No Work ID'))];

  // Generate heatmap data for the last 6 months
  const generateHeatmapData = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    const heatmapData = [];
    
    for (let d = new Date(sixMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayTimesheets = timesheets.filter((ts: Timesheet) => ts.date === dateStr);
      const totalHours = dayTimesheets.reduce((sum: number, ts: Timesheet) => 
        sum + parseFloat(ts.timeInHours), 0
      );
      
      heatmapData.push({
        date: dateStr,
        hours: totalHours,
        count: dayTimesheets.length,
        dayOfWeek: d.getDay(),
        weekIndex: Math.floor((d.getTime() - sixMonthsAgo.getTime()) / (7 * 24 * 60 * 60 * 1000))
      });
    }
    
    return heatmapData;
  };

  const heatmapData = generateHeatmapData();
  
  // Get intensity level for heat map coloring (0-4 scale like GitHub)
  const getIntensity = (hours: number) => {
    if (hours === 0) return 0;
    if (hours <= 2) return 1;
    if (hours <= 4) return 2;
    if (hours <= 6) return 3;
    return 4;
  };

  // Group heatmap data by weeks
  const weeks = Array.from({ length: 26 }, (_, i) => 
    heatmapData.filter(day => day.weekIndex === i)
  ).filter(week => week.length > 0);

  // Filter timesheets by selected week
  const getWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const weekRange = getWeekRange(selectedWeek);
  const filteredTimesheets = timesheets.filter((ts: Timesheet) => 
    ts.date >= weekRange.start && ts.date <= weekRange.end
  );

  // Generate week options for dropdown (last 12 weeks + next 4 weeks)
  const generateWeekOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = -12; i <= 4; i++) {
      const weekStart = new Date(today);
      const dayOfWeek = weekStart.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(today.getDate() + mondayOffset + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startStr = weekStart.toISOString().split('T')[0];
      const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      options.push({ value: startStr, label });
    }
    
    return options;
  };

  const weekOptions = generateWeekOptions();

  if (timesheetsLoading || activitiesLoading || complaintIdsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading timesheets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Management</h1>
          <p className="text-muted-foreground">
            Track your work hours, manage time entries, submit leave requests, and request overtime
          </p>
        </div>
      </div>

      <Tabs defaultValue="timesheets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timesheets" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Entries
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger value="overtime" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Overtime Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timesheets" className="space-y-6">
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-2">
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map(week => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTimesheet(null);
              form.reset({
                date: today,
                activity: "",
                comments: "",
                businessWorkId: "none",
                timeInHours: 8,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTimesheet ? "Edit Time Entry" : "Create New Time Entry"}
              </DialogTitle>
              <DialogDescription>
                {editingTimesheet ? "Update the timesheet entry details." : "Add a new timesheet entry with activity and hours."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeInHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time in Hours *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.25" 
                            min="0.25" 
                            max="24" 
                            placeholder="8" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="activity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an activity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activities.map((activity: string) => (
                            <SelectItem key={activity} value={activity}>
                              {activity}
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
                  name="businessWorkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Work ID / Complaint ID</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Enter complaint ID (optional)"
                            {...field}
                            value={field.value === "none" ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "none" : value);
                            }}
                            list="complaint-ids"
                          />
                        </FormControl>
                        <datalist id="complaint-ids">
                          {validComplaintIds.map((complaintId: string) => (
                            <option key={complaintId} value={complaintId} />
                          ))}
                        </datalist>
                      </div>
                      <FormMessage />
                      <div className="text-xs text-muted-foreground">
                        Start typing to see suggestions. Only valid complaint IDs will be accepted.
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about the work performed..." 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingTimesheet ? "Update Entry" : "Create Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisMonth.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entries This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthTimesheets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Hours/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthTimesheets.length > 0 
                ? (totalHoursThisMonth / currentMonthTimesheets.length).toFixed(1) 
                : '0.0'}h
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Timesheet Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Entries
              </CardTitle>
              <CardDescription>
                Your recorded work hours and activities
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Week:</label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((week) => (
                      <SelectItem key={week.value} value={week.value}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTimesheets.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time entries for this week</h3>
              <p className="text-muted-foreground mb-4">
                {timesheets.length === 0 
                  ? "Start tracking your work hours by creating your first time entry."
                  : "No entries found for the selected week. Try a different week or add new entries."
                }
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Work ID</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets
                    .sort((a: Timesheet, b: Timesheet) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((timesheet: Timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(timesheet.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatHours(timesheet.timeInHours)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{timesheet.activity}</Badge>
                        </TableCell>
                        <TableCell>
                          {timesheet.businessWorkId ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{timesheet.businessWorkId}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {timesheet.comments ? (
                            <span className="text-sm" title={timesheet.comments}>
                              {timesheet.comments.length > 50 
                                ? timesheet.comments.substring(0, 50) + '...' 
                                : timesheet.comments}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(timesheet)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(timesheet.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub-style Contributions Heatmap */}
      {timesheets.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Heatmap - Last 6 Months
            </CardTitle>
            <CardDescription>
              Daily time tracking visualization (GitHub contributions style)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex flex-col gap-1 min-w-[800px]">
                {/* Day labels */}
                <div className="flex gap-1 mb-2">
                  <div className="w-8"></div>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="w-3 h-3 text-xs text-muted-foreground flex items-center justify-center" style={{marginLeft: index === 0 ? '0' : '2px'}}>
                      {index % 2 === 0 ? day.charAt(0) : ''}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap grid */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const dayData = week.find(d => d.dayOfWeek === dayIndex);
                        const intensity = dayData ? getIntensity(dayData.hours) : 0;
                        
                        return (
                          <div
                            key={dayIndex}
                            className={`w-3 h-3 rounded-sm border cursor-pointer ${
                              intensity === 0 ? 'bg-muted border-border' :
                              intensity === 1 ? 'bg-green-200 border-green-300 dark:bg-green-900 dark:border-green-800' :
                              intensity === 2 ? 'bg-green-300 border-green-400 dark:bg-green-800 dark:border-green-700' :
                              intensity === 3 ? 'bg-green-400 border-green-500 dark:bg-green-700 dark:border-green-600' :
                              'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-500'
                            }`}
                            title={dayData ? `${dayData.date}: ${dayData.hours}h (${dayData.count} entries)` : 'No data'}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-sm border ${
                          level === 0 ? 'bg-muted border-border' :
                          level === 1 ? 'bg-green-200 border-green-300 dark:bg-green-900 dark:border-green-800' :
                          level === 2 ? 'bg-green-300 border-green-400 dark:bg-green-800 dark:border-green-700' :
                          level === 3 ? 'bg-green-400 border-green-500 dark:bg-green-700 dark:border-green-600' :
                          'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-500'
                        }`}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color-coded Allocation Widgets */}
      {timesheets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Time Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Activity Time Allocation
              </CardTitle>
              <CardDescription>
                Time distribution across different activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const activityTotals = timesheets.reduce((acc: any, ts: Timesheet) => {
                    acc[ts.activity] = (acc[ts.activity] || 0) + parseFloat(ts.timeInHours);
                    return acc;
                  }, {});
                  
                  const totalHours = Object.values(activityTotals).reduce((sum: number, hours: any) => sum + hours, 0);
                  const activityColors = [
                    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
                    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500',
                    'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
                  ];
                  
                  return Object.entries(activityTotals)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([activity, hours]: any, index) => {
                      const percentage = ((hours / totalHours) * 100).toFixed(1);
                      const colorClass = activityColors[index % activityColors.length];
                      
                      return (
                        <div key={activity} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                              <span className="text-sm font-medium">{activity}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {hours}h ({percentage}%)
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Work ID Time Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Work ID Time Allocation
              </CardTitle>
              <CardDescription>
                Time distribution across work/complaint IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const workIdTotals = timesheets.reduce((acc: any, ts: Timesheet) => {
                    const workId = ts.businessWorkId || 'No Work ID';
                    acc[workId] = (acc[workId] || 0) + parseFloat(ts.timeInHours);
                    return acc;
                  }, {});
                  
                  const totalHours = Object.values(workIdTotals).reduce((sum: number, hours: any) => sum + hours, 0);
                  const workIdColors = [
                    'bg-emerald-500', 'bg-blue-600', 'bg-violet-500', 'bg-rose-500',
                    'bg-orange-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600',
                    'bg-cyan-600', 'bg-lime-600', 'bg-amber-600', 'bg-red-600'
                  ];
                  
                  return Object.entries(workIdTotals)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([workId, hours]: any, index) => {
                      const percentage = ((hours / totalHours) * 100).toFixed(1);
                      const colorClass = workIdColors[index % workIdColors.length];
                      const displayWorkId = workId.length > 20 ? workId.substring(0, 20) + '...' : workId;
                      
                      return (
                        <div key={workId} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                              <span className="text-sm font-medium" title={workId}>{displayWorkId}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {hours}h ({percentage}%)
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Tables */}
      {timesheets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Activity Summary
              </CardTitle>
              <CardDescription>
                Hours spent by day and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      {allActivities.map(activity => (
                        <TableHead key={activity}>{activity}</TableHead>
                      ))}
                      <TableHead className="font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(dailyActivitySummary).sort().map(([date, activities]) => {
                      const dayTotal = Object.values(activities as any).reduce((sum: number, hours: any) => sum + hours, 0);
                      return (
                        <TableRow key={date}>
                          <TableCell className="font-medium">{formatDate(date)}</TableCell>
                          {allActivities.map(activity => (
                            <TableCell key={activity}>
                              {(activities as any)[activity] ? `${(activities as any)[activity]}h` : '-'}
                            </TableCell>
                          ))}
                          <TableCell className="font-semibold">{dayTotal}h</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Activity Summary
              </CardTitle>
              <CardDescription>
                Hours spent by week and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week Start</TableHead>
                      {allActivities.map(activity => (
                        <TableHead key={activity}>{activity}</TableHead>
                      ))}
                      <TableHead className="font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(weeklyActivitySummary).sort().map(([weekStart, activities]) => {
                      const weekTotal = Object.values(activities as any).reduce((sum: number, hours: any) => sum + hours, 0);
                      return (
                        <TableRow key={weekStart}>
                          <TableCell className="font-medium">{formatDate(weekStart)}</TableCell>
                          {allActivities.map(activity => (
                            <TableCell key={activity}>
                              {(activities as any)[activity] ? `${(activities as any)[activity]}h` : '-'}
                            </TableCell>
                          ))}
                          <TableCell className="font-semibold">{weekTotal}h</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Daily Work ID Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daily Work ID Summary
              </CardTitle>
              <CardDescription>
                Hours spent by day and work ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      {allWorkIds.map(workId => (
                        <TableHead key={workId} className="max-w-32 truncate">
                          {workId.length > 12 ? workId.substring(0, 12) + '...' : workId}
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(dailyWorkIdSummary).sort().map(([date, workIds]) => {
                      const dayTotal = Object.values(workIds as any).reduce((sum: number, hours: any) => sum + hours, 0);
                      return (
                        <TableRow key={date}>
                          <TableCell className="font-medium">{formatDate(date)}</TableCell>
                          {allWorkIds.map(workId => (
                            <TableCell key={workId}>
                              {(workIds as any)[workId] ? `${(workIds as any)[workId]}h` : '-'}
                            </TableCell>
                          ))}
                          <TableCell className="font-semibold">{dayTotal}h</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Work ID Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Weekly Work ID Summary
              </CardTitle>
              <CardDescription>
                Hours spent by week and work ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week Start</TableHead>
                      {allWorkIds.map(workId => (
                        <TableHead key={workId} className="max-w-32 truncate">
                          {workId.length > 12 ? workId.substring(0, 12) + '...' : workId}
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(weeklyWorkIdSummary).sort().map(([weekStart, workIds]) => {
                      const weekTotal = Object.values(workIds as any).reduce((sum: number, hours: any) => sum + hours, 0);
                      return (
                        <TableRow key={weekStart}>
                          <TableCell className="font-medium">{formatDate(weekStart)}</TableCell>
                          {allWorkIds.map(workId => (
                            <TableCell key={workId}>
                              {(workIds as any)[workId] ? `${(workIds as any)[workId]}h` : '-'}
                            </TableCell>
                          ))}
                          <TableCell className="font-semibold">{weekTotal}h</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Leave Requests
                </div>
                <Button onClick={() => setIsLeaveDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Leave
                </Button>
              </CardTitle>
              <CardDescription>
                Submit and manage your leave requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequests.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : leaveRequests.data && leaveRequests.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.data.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.leaveType}</TableCell>
                          <TableCell>{formatDate(request.startDate)}</TableCell>
                          <TableCell>{formatDate(request.endDate)}</TableCell>
                          <TableCell>{request.totalDays}</TableCell>
                          <TableCell className="max-w-48 truncate">{request.reason || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {(user?.roles?.includes('approver') || user?.roles?.includes('supervisor')) && request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveLeaveRequestMutation.mutate(request.id)}
                                    disabled={approveLeaveRequestMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason:');
                                      if (reason) {
                                        rejectLeaveRequestMutation.mutate({ id: request.id, reason });
                                      }
                                    }}
                                    disabled={rejectLeaveRequestMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => alert(`Rejection reason: ${request.rejectionReason}`)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
                  <p className="text-muted-foreground">
                    Submit your first leave request to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Overtime Requests
                </div>
                <Button onClick={() => setIsOvertimeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Overtime
                </Button>
              </CardTitle>
              <CardDescription>
                Submit and manage your overtime requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overtimeRequests.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : overtimeRequests.data && overtimeRequests.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overtimeRequests.data.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{formatDate(request.date)}</TableCell>
                          <TableCell>{request.totalHours}h</TableCell>
                          <TableCell className="max-w-48 truncate">{request.reason}</TableCell>
                          <TableCell className="max-w-32 truncate">{request.businessWorkId || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {(user?.roles?.includes('approver') || user?.roles?.includes('supervisor')) && request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveOvertimeRequestMutation.mutate(request.id)}
                                    disabled={approveOvertimeRequestMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason:');
                                      if (reason) {
                                        rejectOvertimeRequestMutation.mutate({ id: request.id, reason });
                                      }
                                    }}
                                    disabled={rejectOvertimeRequestMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => alert(`Rejection reason: ${request.rejectionReason}`)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No overtime requests found</h3>
                  <p className="text-muted-foreground">
                    Submit your first overtime request to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Request Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request for approval.
            </DialogDescription>
          </DialogHeader>
          <Form {...leaveForm}>
            <form onSubmit={leaveForm.handleSubmit((data) => createLeaveRequestMutation.mutate(data))} className="space-y-4">
              <FormField
                control={leaveForm.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                        <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                        <SelectItem value="jury_duty">Jury Duty</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leaveForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leaveForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leaveForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: Reason for leave request"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLeaveRequestMutation.isPending}>
                  {createLeaveRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Overtime Request Dialog */}
      <Dialog open={isOvertimeDialogOpen} onOpenChange={setIsOvertimeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Overtime</DialogTitle>
            <DialogDescription>
              Submit a new overtime request for approval.
            </DialogDescription>
          </DialogHeader>
          <Form {...overtimeForm}>
            <form onSubmit={overtimeForm.handleSubmit((data) => createOvertimeRequestMutation.mutate(data))} className="space-y-4">
              <FormField
                control={overtimeForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={overtimeForm.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.5"
                        max="12"
                        step="0.5"
                        placeholder="e.g., 2.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Number of overtime hours (0.5 - 12)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={overtimeForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason for overtime work"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={overtimeForm.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project/Work ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Related project or complaint ID (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOvertimeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOvertimeRequestMutation.isPending}>
                  {createOvertimeRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}