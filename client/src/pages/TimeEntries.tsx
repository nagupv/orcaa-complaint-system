import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Plus, Edit, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addDays, subDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Timesheet, InsertTimesheet } from "@shared/schema";

const timesheetFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().min(0.1, "Hours must be at least 0.1").max(24, "Hours cannot exceed 24"),
  activity: z.string().min(1, "Activity is required"),
  businessWorkId: z.string().optional(),
  comments: z.string().optional(),
});

type TimesheetFormData = z.infer<typeof timesheetFormSchema>;

export default function TimeEntries() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      hours: 8,
      activity: "",
      businessWorkId: "",
      comments: "",
    },
  });

  // Fetch timesheets
  const { data: timesheets = [] } = useQuery({
    queryKey: ["/api/timesheets"],
  });

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/timesheet-activities"],
  });

  // Fetch valid complaint IDs
  const { data: validComplaintIds = [] } = useQuery({
    queryKey: ["/api/valid-complaint-ids"],
  });

  // Create timesheet mutation
  const createTimesheetMutation = useMutation({
    mutationFn: async (data: TimesheetFormData) => {
      const timesheetData: InsertTimesheet = {
        userId: user?.id || "",
        date: data.date,
        hours: data.hours,
        activity: data.activity,
        businessWorkId: data.businessWorkId || null,
        comments: data.comments || null,
      };
      return apiRequest("POST", "/api/timesheets", timesheetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update timesheet mutation
  const updateTimesheetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TimesheetFormData }) => {
      const timesheetData: Partial<InsertTimesheet> = {
        date: data.date,
        hours: data.hours,
        activity: data.activity,
        businessWorkId: data.businessWorkId || null,
        comments: data.comments || null,
      };
      return apiRequest("PUT", `/api/timesheets/${id}`, timesheetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      form.reset();
      setEditingTimesheet(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete timesheet mutation
  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TimesheetFormData) => {
    if (editingTimesheet) {
      updateTimesheetMutation.mutate({ id: editingTimesheet.id, data });
    } else {
      createTimesheetMutation.mutate(data);
    }
  };

  const handleEdit = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    form.reset({
      date: timesheet.date,
      hours: timesheet.hours,
      activity: timesheet.activity,
      businessWorkId: timesheet.businessWorkId || "",
      comments: timesheet.comments || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewEntry = () => {
    setEditingTimesheet(null);
    form.reset({
      date: format(new Date(), "yyyy-MM-dd"),
      hours: 8,
      activity: "",
      businessWorkId: "",
      comments: "",
    });
    setIsDialogOpen(true);
  };

  const weekStart = selectedWeek;
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredTimesheets = timesheets.filter((ts: Timesheet) => 
    ts.userId === user?.id &&
    new Date(ts.date) >= weekStart &&
    new Date(ts.date) <= weekEnd
  );

  const totalHoursThisWeek = filteredTimesheets.reduce((sum: number, ts: Timesheet) => sum + ts.hours, 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orcaa-blue">Time Entries</h1>
          <p className="text-gray-600 mt-2">Track your daily work hours and activities</p>
        </div>

        {/* Week Selector */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Week of {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(subDays(weekStart, 7))}
                >
                  Previous Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  Current Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(addDays(weekStart, 7))}
                >
                  Next Week
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Total Hours: <span className="font-semibold">{totalHoursThisWeek}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Time Entries Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Time Entries</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewEntry} className="bg-orcaa-blue hover:bg-orcaa-blue/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTimesheet ? "Edit Time Entry" : "Add Time Entry"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        name="hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hours *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0.1" max="24" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="activity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity" />
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
                            <FormLabel>Complaint ID</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                list="complaint-ids"
                                placeholder="e.g., AQ-2025-001"
                              />
                            </FormControl>
                            <datalist id="complaint-ids">
                              {validComplaintIds.map((id: string) => (
                                <option key={id} value={id} />
                              ))}
                            </datalist>
                            <FormMessage />
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
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-orcaa-blue hover:bg-orcaa-blue/90"
                          disabled={createTimesheetMutation.isPending || updateTimesheetMutation.isPending}
                        >
                          {editingTimesheet ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTimesheets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No time entries for this week</p>
                <p className="text-sm">Click "Add Entry" to create your first time entry</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Work ID</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets
                    .sort((a: Timesheet, b: Timesheet) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((timesheet: Timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell>
                          {format(parseISO(timesheet.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {timesheet.hours}h
                          </Badge>
                        </TableCell>
                        <TableCell>{timesheet.activity}</TableCell>
                        <TableCell>
                          {timesheet.businessWorkId || (
                            <span className="text-gray-400 italic">No Work ID</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {timesheet.comments ? (
                            <span title={timesheet.comments} className="cursor-help">
                              {timesheet.comments.length > 30 
                                ? `${timesheet.comments.substring(0, 30)}...` 
                                : timesheet.comments}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No comments</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(timesheet)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimesheetMutation.mutate(timesheet.id)}
                              disabled={deleteTimesheetMutation.isPending}
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
    </div>
  );
}