import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Plus, Edit, Trash2, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Timesheet, InsertTimesheet } from "@shared/schema";

const timesheetFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  activity: z.string().min(1, "Activity is required"),
  comments: z.string().optional(),
  businessWorkId: z.string().optional(),
  timeInHours: z.coerce.number().min(0.25, "Minimum 0.25 hours required").max(24, "Maximum 24 hours per entry"),
});

type TimesheetFormData = z.infer<typeof timesheetFormSchema>;

export default function TimesheetManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);

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
          <h1 className="text-3xl font-bold tracking-tight">Timesheet Management</h1>
          <p className="text-muted-foreground">
            Track your work hours and activities
          </p>
        </div>

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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a valid complaint ID (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (optional)</SelectItem>
                          {validComplaintIds.map((complaintId: string) => (
                            <SelectItem key={complaintId} value={complaintId}>
                              {complaintId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <div className="text-xs text-muted-foreground">
                        Only valid complaint IDs are available for selection
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

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entries
          </CardTitle>
          <CardDescription>
            Your recorded work hours and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your work hours by creating your first time entry.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {timesheets
                .sort((a: Timesheet, b: Timesheet) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((timesheet: Timesheet) => (
                  <div key={timesheet.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(timesheet.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatHours(timesheet.timeInHours)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Activity: </span>
                        <Badge variant="secondary">{timesheet.activity}</Badge>
                      </div>
                      
                      {timesheet.businessWorkId && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Work ID: {timesheet.businessWorkId}</span>
                        </div>
                      )}
                      
                      {timesheet.comments && (
                        <div>
                          <span className="text-sm text-muted-foreground">Comments: </span>
                          <span className="text-sm">{timesheet.comments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}