import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComplaintForm from "@/pages/ComplaintForm";
import Dashboard from "@/pages/Dashboard";
import WorkflowManagement from "@/pages/WorkflowManagement";
import AuditTrail from "@/pages/AuditTrail";
import ApplicationManagement from "@/pages/ApplicationManagement";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [activeTab, setActiveTab] = useState("public-form");
  const { user } = useAuth();
  
  const hasUserManagementAccess = user?.roles && Array.isArray(typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles) && (typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles).some((role: string) => 
    ['admin', 'supervisor', 'approver'].includes(role)
  );
  const tabCount = hasUserManagementAccess ? 5 : 4;

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full flex-wrap gap-1">
            <TabsTrigger value="public-form" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Public Complaint Form
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Workflow Management
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
              Audit Trail
            </TabsTrigger>
            {hasUserManagementAccess && (
              <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                Application Management
              </TabsTrigger>
            )}
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

          {hasUserManagementAccess && (
            <TabsContent value="users" className="mt-6">
              <ApplicationManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
