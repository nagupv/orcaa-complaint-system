import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DemoWorkflowGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDemoWorkflowMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      // Create a demo workflow first
      const workflowResponse = await apiRequest("POST", "/api/workflows", {
        name: "Air Quality Inspection Demo",
        description: "Demo workflow for air quality complaint inspection process",
        complaintType: "AIR_QUALITY",
        isTemplate: true,
        workflowData: {
          nodes: [
            {
              id: "start",
              type: "Start",
              position: { x: 100, y: 100 },
              data: { label: "Start" }
            },
            {
              id: "initial-inspection",
              type: "Initial Inspection",
              position: { x: 300, y: 100 },
              data: { label: "Initial Inspection", assignedRole: "field_staff" }
            },
            {
              id: "assessment",
              type: "Assessment",
              position: { x: 500, y: 100 },
              data: { label: "Assessment", assignedRole: "supervisor" }
            },
            {
              id: "enforcement",
              type: "Enforcement Action",
              position: { x: 700, y: 100 },
              data: { label: "Enforcement Action", assignedRole: "admin" }
            },
            {
              id: "resolution",
              type: "Resolution",
              position: { x: 900, y: 100 },
              data: { label: "Resolution", assignedRole: "approver" }
            },
            {
              id: "end",
              type: "End",
              position: { x: 1100, y: 100 },
              data: { label: "End" }
            }
          ],
          edges: [
            { id: "e1", source: "start", target: "initial-inspection" },
            { id: "e2", source: "initial-inspection", target: "assessment" },
            { id: "e3", source: "assessment", target: "enforcement" },
            { id: "e4", source: "enforcement", target: "resolution" },
            { id: "e5", source: "resolution", target: "end" }
          ]
        }
      });

      const workflow = await workflowResponse.json();

      // Set this as the template for Air Quality complaints
      await apiRequest("POST", `/api/workflow-templates/${workflow.id}/set-template`, {
        complaintType: "AIR_QUALITY"
      });

      // Get an existing complaint (assuming there's at least one)
      const complaintsResponse = await fetch("/api/complaints", {
        credentials: "include",
      });
      const complaints = await complaintsResponse.json();
      
      if (complaints.length === 0) {
        throw new Error("No complaints found to demo with");
      }

      const complaint = complaints[0];

      // Assign the workflow to the complaint
      await apiRequest("POST", `/api/complaints/${complaint.id}/assign-workflow`, {
        workflowId: workflow.id
      });

      // Create workflow tasks from the workflow
      const tasksResponse = await apiRequest("POST", `/api/complaints/${complaint.id}/create-workflow-tasks`, {});
      const tasks = await tasksResponse.json();

      return { workflow, tasks, complaint };
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      
      toast({
        title: "Demo Workflow Generated",
        description: `Created ${data.tasks.length} workflow tasks for complaint ${data.complaint.complaintId}`,
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error('Error generating demo workflow:', error);
      toast({
        title: "Error",
        description: "Failed to generate demo workflow",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Workflow Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a complete demo workflow with tasks for testing the new inbox functionality:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Creates Air Quality Inspection workflow template</li>
            <li>• Assigns workflow to existing complaint</li>
            <li>• Generates Initial Inspection, Assessment, Enforcement Action, and Resolution tasks</li>
            <li>• Creates inbox items for assigned users</li>
          </ul>
          <Button 
            onClick={() => generateDemoWorkflowMutation.mutate()}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating Demo..." : "Generate Demo Workflow"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}