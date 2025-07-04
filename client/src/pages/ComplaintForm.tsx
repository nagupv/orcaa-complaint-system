import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { insertComplaintSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ComplaintFormFields from "@/components/ComplaintFormFields";
import { z } from "zod";

const complaintFormSchema = insertComplaintSchema.extend({
  problemTypes: z.array(z.string()).min(1, "Please select at least one problem type"),
  lastOccurred: z.date().optional(),
});

type ComplaintFormData = z.infer<typeof complaintFormSchema>;

export default function ComplaintForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState<string>("");

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      complaintType: "AIR_QUALITY",
      isAnonymous: false,
      complainantEmail: "",
      complainantFirstName: "",
      complainantLastName: "",
      complainantAddress: "",
      complainantCity: "",
      complainantState: "Washington",
      complainantZipCode: "",
      complainantPhone: "",
      sourceName: "",
      sourceAddress: "",
      sourceCity: "",
      problemTypes: [],
      otherDescription: "",
      previousContact: false,
      priority: "normal",
      status: "initiated",
    },
  });

  const submitComplaint = useMutation({
    mutationFn: async (data: ComplaintFormData) => {
      const response = await apiRequest("POST", "/api/complaints", data);
      return response.json();
    },
    onSuccess: (data) => {
      setComplaintId(data.complaintId);
      setIsSubmitted(true);
      toast({
        title: "Complaint Submitted Successfully",
        description: `Your complaint ID is ${data.complaintId}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ComplaintFormData) => {
    submitComplaint.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully</h2>
            <p className="text-gray-600 mb-4">
              Your complaint has been received and assigned ID: <strong>{complaintId}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to the provided email address. 
              Please keep this complaint ID for your records.
            </p>
            <Button 
              onClick={() => {
                setIsSubmitted(false);
                setComplaintId("");
                form.reset();
              }}
              className="bg-orcaa-blue hover:bg-orcaa-blue-light"
            >
              Submit Another Complaint
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">File an Air Quality Complaint</CardTitle>
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>We're listening…</strong><br />
            ORCAA accepts complaints related to smoke, open fire, wood stoves, odors, and other emissions. 
            ORCAA's jurisdiction includes Clallam, Grays Harbor, Jefferson, Mason, Pacific, and Thurston Counties.
          </AlertDescription>
        </Alert>

        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Note:</strong> Complaints filed using this form may not be read until the next business day. 
            For life-threatening emergencies, please call 9-1-1.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ComplaintFormFields form={form} />

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={submitComplaint.isPending}
              className="bg-orcaa-blue hover:bg-orcaa-blue-light text-white px-6 py-2 font-medium"
            >
              {submitComplaint.isPending ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
