import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import ComplaintForm from "@/pages/ComplaintForm";
import Dashboard from "@/pages/Dashboard";
import WorkflowManagement from "@/pages/WorkflowManagement";
import AuditTrail from "@/pages/AuditTrail";

export default function Home() {
  const [activeTab, setActiveTab] = useState("public-form");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="public-form" className="data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Public Complaint Form
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Workflow Management
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public-form" className="mt-6">
            <ComplaintForm />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="workflow" className="mt-6">
            <WorkflowManagement />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditTrail />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
