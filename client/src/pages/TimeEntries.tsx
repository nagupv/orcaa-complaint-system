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

      {/* Analytics and Reports Section */}
      {filteredTimesheets && filteredTimesheets.length > 0 && (
        <div className="space-y-6">
          {/* Time Allocation Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Allocation Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time by Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const activityTotals = filteredTimesheets.reduce((acc: any, ts: any) => {
                    const hours = parseFloat(ts.timeInHours);
                    acc[ts.activity] = (acc[ts.activity] || 0) + hours;
                    return acc;
                  }, {});
                  
                  const totalHours = Object.values(activityTotals).reduce((sum: number, hours: any) => sum + hours, 0);
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];
                  
                  return (
                    <div className="space-y-3">
                      {Object.entries(activityTotals).map(([activity, hours]: [string, any], index) => {
                        const percentage = ((hours / totalHours) * 100).toFixed(1);
                        return (
                          <div key={activity} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{activity}</span>
                              <span className="text-gray-600">{hours}h ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Work ID Allocation Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Time by Work ID
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const workIdTotals = filteredTimesheets.reduce((acc: any, ts: any) => {
                    const hours = parseFloat(ts.timeInHours);
                    const workId = ts.businessWorkId || 'No Work ID';
                    acc[workId] = (acc[workId] || 0) + hours;
                    return acc;
                  }, {});
                  
                  const totalHours = Object.values(workIdTotals).reduce((sum: number, hours: any) => sum + hours, 0);
                  const colors = ['bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-rose-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'];
                  
                  return (
                    <div className="space-y-3">
                      {Object.entries(workIdTotals).map(([workId, hours]: [string, any], index) => {
                        const percentage = ((hours / totalHours) * 100).toFixed(1);
                        return (
                          <div key={workId} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{workId}</span>
                              <span className="text-gray-600">{hours}h ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* GitHub-style Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Time Tracking Heatmap (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const today = new Date();
                const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
                const days = eachDayOfInterval({ start: sixMonthsAgo, end: today });
                
                const heatmapData = filteredTimesheets.reduce((acc: any, ts: any) => {
                  const date = ts.date;
                  const hours = parseFloat(ts.timeInHours);
                  acc[date] = (acc[date] || 0) + hours;
                  return acc;
                }, {});
                
                const maxHours = Object.values(heatmapData).length > 0 ? Math.max(...Object.values(heatmapData) as number[]) : 1;
                
                const getIntensity = (hours: number) => {
                  if (hours === 0) return 0;
                  if (hours <= maxHours * 0.25) return 1;
                  if (hours <= maxHours * 0.5) return 2;
                  if (hours <= maxHours * 0.75) return 3;
                  return 4;
                };
                
                const getIntensityColor = (intensity: number) => {
                  const colors = {
                    0: 'bg-gray-100',
                    1: 'bg-green-200',
                    2: 'bg-green-300',
                    3: 'bg-green-500',
                    4: 'bg-green-700'
                  };
                  return colors[intensity as keyof typeof colors];
                };
                
                return (
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 gap-1 w-fit">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-xs text-gray-500 text-center mb-1">{day}</div>
                      ))}
                      {days.map((day, index) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const hours = heatmapData[dateStr] || 0;
                        const intensity = getIntensity(hours);
                        return (
                          <div
                            key={index}
                            className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
                            title={`${format(day, 'MMM dd, yyyy')}: ${hours}h`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                      <span>Less</span>
                      {[0, 1, 2, 3, 4].map(intensity => (
                        <div key={intensity} className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`} />
                      ))}
                      <span>More</span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Summary Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dailyActivitySummary = filteredTimesheets.reduce((acc: any, ts: any) => {
                    const date = ts.date;
                    const activity = ts.activity;
                    const hours = parseFloat(ts.timeInHours);
                    
                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][activity]) acc[date][activity] = 0;
                    acc[date][activity] += hours;
                    
                    return acc;
                  }, {});
                  
                  const allActivities = Array.from(new Set(filteredTimesheets.map((ts: any) => ts.activity)));
                  
                  return (
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
                                <TableCell className="font-medium">{format(parseISO(date), 'MMM dd')}</TableCell>
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
                  );
                })()}
              </CardContent>
            </Card>

            {/* Daily Work ID Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Daily Work ID Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dailyWorkIdSummary = filteredTimesheets.reduce((acc: any, ts: any) => {
                    const date = ts.date;
                    const workId = ts.businessWorkId || 'No Work ID';
                    const hours = parseFloat(ts.timeInHours);
                    
                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][workId]) acc[date][workId] = 0;
                    acc[date][workId] += hours;
                    
                    return acc;
                  }, {});
                  
                  const allWorkIds = Array.from(new Set(filteredTimesheets.map((ts: any) => ts.businessWorkId || 'No Work ID')));
                  
                  return (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            {allWorkIds.map(workId => (
                              <TableHead key={workId}>{workId}</TableHead>
                            ))}
                            <TableHead className="font-semibold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(dailyWorkIdSummary).sort().map(([date, workIds]) => {
                            const dayTotal = Object.values(workIds as any).reduce((sum: number, hours: any) => sum + hours, 0);
                            return (
                              <TableRow key={date}>
                                <TableCell className="font-medium">{format(parseISO(date), 'MMM dd')}</TableCell>
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
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}