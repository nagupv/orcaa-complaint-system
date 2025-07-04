import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { COUNTIES } from "@/lib/constants";
import { Link } from "wouter";
import { ArrowLeft, FileText, Info } from "lucide-react";

const demolitionFormSchema = z.object({
  // Property Owner Information
  propertyOwnerName: z.string().min(1, "Property owner name is required"),
  propertyOwnerEmail: z.string().email("Valid email is required"),
  propertyOwnerPhone: z.string().min(1, "Phone number is required"),
  propertyOwnerAddress: z.string().min(1, "Property owner address is required"),
  
  // Work Site Information
  workSiteAddress: z.string().min(1, "Work site address is required"),
  workSiteCity: z.string().min(1, "Work site city is required"),
  workSiteZip: z.string().min(5, "Valid ZIP code is required"),
  workSiteCounty: z.string().min(1, "County is required"),
  
  // Project Information
  isPrimaryResidence: z.boolean(),
  
  // Asbestos Information
  asbestosToBeRemoved: z.boolean(),
  asbestosNotificationNumber: z.string().optional(),
  projectStartDate: z.string().min(1, "Project start date is required"),
  projectCompletionDate: z.string().min(1, "Project completion date is required"),
  asbestosSquareFeet: z.string().optional(),
  asbestosLinearFeet: z.string().optional(),
  asbestosContractorName: z.string().optional(),
  isNeshapProject: z.boolean().optional(),
  
  // Project Description
  problemDescription: z.string().min(10, "Project description is required (minimum 10 characters)"),
});

type DemolitionFormData = z.infer<typeof demolitionFormSchema>;

export default function DemolitionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DemolitionFormData>({
    resolver: zodResolver(demolitionFormSchema),
    defaultValues: {
      isPrimaryResidence: false,
      asbestosToBeRemoved: false,
      isNeshapProject: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: DemolitionFormData) => {
      // Calculate start date validation (14 days from now)
      const startDate = new Date(data.projectStartDate);
      const minStartDate = new Date();
      minStartDate.setDate(minStartDate.getDate() + 14);
      
      if (startDate < minStartDate) {
        throw new Error("Project start date must be at least 14 days from today");
      }

      const formData = {
        complaintType: "DEMOLITION_NOTICE",
        propertyOwnerName: data.propertyOwnerName,
        propertyOwnerEmail: data.propertyOwnerEmail,
        propertyOwnerPhone: data.propertyOwnerPhone,
        propertyOwnerAddress: data.propertyOwnerAddress,
        workSiteAddress: data.workSiteAddress,
        workSiteCity: data.workSiteCity,
        workSiteZip: data.workSiteZip,
        workSiteCounty: data.workSiteCounty,
        isPrimaryResidence: data.isPrimaryResidence,
        asbestosToBeRemoved: data.asbestosToBeRemoved,
        asbestosNotificationNumber: data.asbestosNotificationNumber,
        projectStartDate: new Date(data.projectStartDate),
        projectCompletionDate: new Date(data.projectCompletionDate),
        asbestosSquareFeet: data.asbestosSquareFeet ? parseInt(data.asbestosSquareFeet) : null,
        asbestosLinearFeet: data.asbestosLinearFeet ? parseInt(data.asbestosLinearFeet) : null,
        asbestosContractorName: data.asbestosContractorName,
        isNeshapProject: data.isNeshapProject,
        problemDescription: data.problemDescription,
        problemTypes: ["demolition"],
        // Use property owner as complainant for demolition notices
        complainantFirstName: data.propertyOwnerName.split(' ')[0],
        complainantLastName: data.propertyOwnerName.split(' ').slice(1).join(' '),
        complainantEmail: data.propertyOwnerEmail,
        complainantPhone: data.propertyOwnerPhone,
        complainantAddress: data.propertyOwnerAddress,
        sourceAddress: data.workSiteAddress,
        sourceCity: data.workSiteCity,
      };

      return await apiRequest("/api/complaints", "POST", formData);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Demolition Notification Submitted",
        description: `Your notification ${response.complaintId} has been submitted and is under review.`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DemolitionFormData) => {
    setIsSubmitting(true);
    submitMutation.mutate(data);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-orcaa-blue" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demolition Notification</h1>
              <p className="text-gray-600">Required for demolition projects larger than 120 sq. ft.</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-semibold text-amber-800 mb-1">Important Requirements:</h3>
              <ul className="text-amber-700 space-y-1">
                <li>• Demolition notifications require 14-day advance notice</li>
                <li>• An asbestos survey is required for all demolition projects</li>
                <li>• The survey must be conducted by a certified AHERA building inspector</li>
                <li>• Project start date must be at least 14 days from submission</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Property Owner Section */}
          <Card>
            <CardHeader>
              <CardTitle>Property Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyOwnerName">Property Owner Name *</Label>
                  <Input
                    id="propertyOwnerName"
                    {...form.register("propertyOwnerName")}
                    className={form.formState.errors.propertyOwnerName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.propertyOwnerName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.propertyOwnerName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="propertyOwnerEmail">Email Address *</Label>
                  <Input
                    id="propertyOwnerEmail"
                    type="email"
                    {...form.register("propertyOwnerEmail")}
                    className={form.formState.errors.propertyOwnerEmail ? "border-red-500" : ""}
                  />
                  {form.formState.errors.propertyOwnerEmail && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.propertyOwnerEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="propertyOwnerPhone">Phone Number *</Label>
                  <Input
                    id="propertyOwnerPhone"
                    type="tel"
                    {...form.register("propertyOwnerPhone")}
                    className={form.formState.errors.propertyOwnerPhone ? "border-red-500" : ""}
                  />
                  {form.formState.errors.propertyOwnerPhone && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.propertyOwnerPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="propertyOwnerAddress">Mailing Address *</Label>
                <Textarea
                  id="propertyOwnerAddress"
                  {...form.register("propertyOwnerAddress")}
                  className={form.formState.errors.propertyOwnerAddress ? "border-red-500" : ""}
                  rows={3}
                />
                {form.formState.errors.propertyOwnerAddress && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.propertyOwnerAddress.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Site Section */}
          <Card>
            <CardHeader>
              <CardTitle>Work Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workSiteAddress">Work Site Address *</Label>
                <Input
                  id="workSiteAddress"
                  {...form.register("workSiteAddress")}
                  className={form.formState.errors.workSiteAddress ? "border-red-500" : ""}
                />
                {form.formState.errors.workSiteAddress && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.workSiteAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="workSiteCity">City *</Label>
                  <Input
                    id="workSiteCity"
                    {...form.register("workSiteCity")}
                    className={form.formState.errors.workSiteCity ? "border-red-500" : ""}
                  />
                  {form.formState.errors.workSiteCity && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.workSiteCity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workSiteZip">ZIP Code *</Label>
                  <Input
                    id="workSiteZip"
                    {...form.register("workSiteZip")}
                    className={form.formState.errors.workSiteZip ? "border-red-500" : ""}
                  />
                  {form.formState.errors.workSiteZip && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.workSiteZip.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workSiteCounty">County *</Label>
                  <Select onValueChange={(value) => form.setValue("workSiteCounty", value)}>
                    <SelectTrigger className={form.formState.errors.workSiteCounty ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select County" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTIES.map((county) => (
                        <SelectItem key={county.value} value={county.value}>
                          {county.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.workSiteCounty && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.workSiteCounty.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrimaryResidence"
                  checked={form.watch("isPrimaryResidence")}
                  onCheckedChange={(checked) => form.setValue("isPrimaryResidence", !!checked)}
                />
                <Label htmlFor="isPrimaryResidence">
                  This is the property owner's primary residence
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Project Dates Section */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectStartDate">Project Start Date *</Label>
                  <Input
                    id="projectStartDate"
                    type="date"
                    {...form.register("projectStartDate")}
                    className={form.formState.errors.projectStartDate ? "border-red-500" : ""}
                    min={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  {form.formState.errors.projectStartDate && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.projectStartDate.message}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">Must be at least 14 days from today</p>
                </div>

                <div>
                  <Label htmlFor="projectCompletionDate">Project Completion Date *</Label>
                  <Input
                    id="projectCompletionDate"
                    type="date"
                    {...form.register("projectCompletionDate")}
                    className={form.formState.errors.projectCompletionDate ? "border-red-500" : ""}
                  />
                  {form.formState.errors.projectCompletionDate && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.projectCompletionDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="problemDescription">Project Description *</Label>
                <Textarea
                  id="problemDescription"
                  {...form.register("problemDescription")}
                  className={form.formState.errors.problemDescription ? "border-red-500" : ""}
                  rows={4}
                  placeholder="Describe the demolition project, including scope of work and any special considerations..."
                />
                {form.formState.errors.problemDescription && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.problemDescription.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Asbestos Section */}
          <Card>
            <CardHeader>
              <CardTitle>Asbestos Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="asbestosToBeRemoved"
                  checked={form.watch("asbestosToBeRemoved")}
                  onCheckedChange={(checked) => form.setValue("asbestosToBeRemoved", !!checked)}
                />
                <Label htmlFor="asbestosToBeRemoved">
                  Asbestos will be removed as part of this project
                </Label>
              </div>

              {form.watch("asbestosToBeRemoved") && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="asbestosNotificationNumber">Asbestos Notification Number (if applicable)</Label>
                    <Input
                      id="asbestosNotificationNumber"
                      {...form.register("asbestosNotificationNumber")}
                      placeholder="Enter ORCAA asbestos notification number"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="asbestosSquareFeet">Asbestos Square Feet</Label>
                      <Input
                        id="asbestosSquareFeet"
                        type="number"
                        {...form.register("asbestosSquareFeet")}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="asbestosLinearFeet">Asbestos Linear Feet</Label>
                      <Input
                        id="asbestosLinearFeet"
                        type="number"
                        {...form.register("asbestosLinearFeet")}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="asbestosContractorName">Asbestos Contractor Name</Label>
                    <Input
                      id="asbestosContractorName"
                      {...form.register("asbestosContractorName")}
                      placeholder="Enter contractor name or 'self' for homeowner"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isNeshapProject"
                      checked={form.watch("isNeshapProject")}
                      onCheckedChange={(checked) => form.setValue("isNeshapProject", !!checked)}
                    />
                    <Label htmlFor="isNeshapProject">
                      This is a NESHAP project (14-day waiting period)
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || submitMutation.isPending}
              className="bg-orcaa-blue hover:bg-orcaa-blue/90 text-white px-8 py-3"
            >
              {isSubmitting || submitMutation.isPending ? "Submitting..." : "Submit Notification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}