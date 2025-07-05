import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Plus, Check, X, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { OvertimeRequest, InsertOvertimeRequest } from "@shared/schema";

const overtimeRequestFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().min(0.1, "Hours must be at least 0.1").max(12, "Overtime hours cannot exceed 12"),
  projectDescription: z.string().min(1, "Project description is required"),
  justification: z.string().min(1, "Justification is required"),
});

type OvertimeRequestFormData = z.infer<typeof overtimeRequestFormSchema>;

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export default function OvertimeRequests() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OvertimeRequestFormData>({
    resolver: zodResolver(overtimeRequestFormSchema),
    defaultValues: {
      date: "",
      hours: 1,
      projectDescription: "",
      justification: "",
    },
  });

  // Fetch overtime requests
  const { data: overtimeRequests = [] } = useQuery({
    queryKey: ["/api/overtime-requests"],
  });

  // Create overtime request mutation
  const createOvertimeRequestMutation = useMutation({
    mutationFn: async (data: OvertimeRequestFormData) => {
      const overtimeRequestData: InsertOvertimeRequest = {
        userId: user?.id || "",
        date: data.date,
        hours: data.hours,
        projectDescription: data.projectDescription,
        justification: data.justification,
        status: "pending",
      };
      return apiRequest("POST", "/api/overtime-requests", overtimeRequestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime-requests"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Overtime request submitted successfully",
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

  const onSubmit = (data: OvertimeRequestFormData) => {
    // Validate that the date is not in the future
    const requestDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (requestDate > today) {
      toast({
        title: "Error",
        description: "Overtime date cannot be in the future",
        variant: "destructive",
      });
      return;
    }

    createOvertimeRequestMutation.mutate(data);
  };

  const userOvertimeRequests = overtimeRequests.filter((req: OvertimeRequest) => req.userId === user?.id);
  const totalOvertimeHours = userOvertimeRequests
    .filter((req: OvertimeRequest) => req.status === 'approved')
    .reduce((sum: number, req: OvertimeRequest) => sum + req.hours, 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orcaa-blue">Overtime Requests</h1>
          <p className="text-gray-600 mt-2">Submit and track your overtime work requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userOvertimeRequests.length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orcaa-blue" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {userOvertimeRequests.filter((req: OvertimeRequest) => req.status === 'approved').length}
                  </p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {userOvertimeRequests.filter((req: OvertimeRequest) => req.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Hours</p>
                  <p className="text-2xl font-bold text-orcaa-blue">
                    {totalOvertimeHours}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orcaa-blue" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overtime Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Overtime Requests</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orcaa-blue hover:bg-orcaa-blue/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Overtime Request</DialogTitle>
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
                          name="hours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hours *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  min="0.1" 
                                  max="12" 
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
                        name="projectDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3} 
                                placeholder="Describe the project or work that required overtime"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification *</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={4} 
                                placeholder="Explain why overtime was necessary and any urgency involved"
                              />
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
                          disabled={createOvertimeRequestMutation.isPending}
                        >
                          Submit Request
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {userOvertimeRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No overtime requests submitted</p>
                <p className="text-sm">Click "New Request" to submit your first overtime request</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Justification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userOvertimeRequests
                    .sort((a: OvertimeRequest, b: OvertimeRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((request: OvertimeRequest) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(parseISO(request.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {request.hours}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span title={request.projectDescription} className="cursor-help">
                            {request.projectDescription.length > 40 
                              ? `${request.projectDescription.substring(0, 40)}...` 
                              : request.projectDescription}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(request.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span title={request.justification} className="cursor-help">
                            {request.justification.length > 50 
                              ? `${request.justification.substring(0, 50)}...` 
                              : request.justification}
                          </span>
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