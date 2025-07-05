import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./UserManagement";
import RoleManagement from "./RoleManagement";
import UserRoleMapping from "./UserRoleMapping";
import UserRoleReport from "./UserRoleReport";
import ListValueManagement from "./ListValueManagement";
import WorkflowDesigner from "./WorkflowDesigner";
import WorkflowTemplates from "./WorkflowTemplates";

export default function ApplicationManagement() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-orcaa-blue">
              Application Management
            </CardTitle>
            <p className="text-gray-600">
              Manage users, roles, and permissions for the ORCAA complaint management system
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex w-full flex-wrap gap-1">
                <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  User Management
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  Role Management
                </TabsTrigger>
                <TabsTrigger value="list-values" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  List Values
                </TabsTrigger>
                <TabsTrigger value="workflow" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  Workflow Designer
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  Workflow Templates
                </TabsTrigger>
                <TabsTrigger value="mapping" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  User & Role Mapping
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-orcaa-blue data-[state=active]:text-white">
                  User Role Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-6">
                <UserManagement />
              </TabsContent>

              <TabsContent value="roles" className="mt-6">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="list-values" className="mt-6">
                <ListValueManagement />
              </TabsContent>

              <TabsContent value="workflow" className="mt-6">
                <WorkflowDesigner />
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <WorkflowTemplates />
              </TabsContent>

              <TabsContent value="mapping" className="mt-6">
                <UserRoleMapping />
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <UserRoleReport />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}