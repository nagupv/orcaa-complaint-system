import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import UserManagement from "./UserManagement";
import RoleManagement from "./RoleManagement";
import UserRoleMapping from "./UserRoleMapping";
import UserRoleReport from "./UserRoleReport";
import ListValueManagement from "./ListValueManagement";
import WorkflowDesigner from "./WorkflowDesigner";
import WorkflowTemplates from "./WorkflowTemplates";
import RoleActionMapping from "./RoleActionMapping";

export default function ApplicationManagement() {
  const [activeSection, setActiveSection] = useState("users");
  const [activeMappingSection, setActiveMappingSection] = useState("user-role");



  const menuItems = [
    { id: "users", label: "User Management", component: UserManagement },
    { id: "roles", label: "Role Management", component: RoleManagement },
    { id: "list-values", label: "List Values", component: ListValueManagement },
    { id: "workflow", label: "Workflow Designer", component: WorkflowDesigner },
    { id: "templates", label: "Workflow Templates", component: WorkflowTemplates },
    { 
      id: "mappings", 
      label: "Mappings", 
      submenu: [
        { id: "user-role", label: "User & Role Mapping", component: UserRoleMapping },
        { id: "role-action", label: "Role-Action Mapping", component: RoleActionMapping }
      ]
    },
    { id: "reports", label: "User Role Report", component: UserRoleReport }
  ];

  const renderContent = () => {
    if (activeSection === "mappings") {
      const mappingItem = menuItems.find(item => item.id === "mappings");
      const activeMapping = mappingItem?.submenu?.find(sub => sub.id === activeMappingSection);
      const Component = activeMapping?.component;
      return Component ? <Component /> : null;
    } else {
      const activeItem = menuItems.find(item => item.id === activeSection);
      const Component = activeItem?.component;
      return Component ? <Component /> : (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold text-orcaa-blue mb-2">User Management</h3>
                <p className="text-sm text-gray-600">Create, update, and manage user accounts</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold text-orcaa-blue mb-2">Role Management</h3>
                <p className="text-sm text-gray-600">Define and manage user roles</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold text-orcaa-blue mb-2">List Values</h3>
                <p className="text-sm text-gray-600">Configure system list values</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold text-orcaa-blue mb-2">Workflow Designer</h3>
                <p className="text-sm text-gray-600">Design and configure workflows</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold text-orcaa-blue mb-2">Workflow Templates</h3>
                <p className="text-sm text-gray-600">Manage workflow templates</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold text-orcaa-blue mb-2">User Role Report</h3>
                <p className="text-sm text-gray-600">View user role assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Area - Navigation handled by header dropdown */}
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}