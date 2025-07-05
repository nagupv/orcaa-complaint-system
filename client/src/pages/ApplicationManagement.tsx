import { useState } from "react";
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
      return Component ? <Component /> : null;
    }
  };

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
            {/* Hover Navigation Menu */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
              {menuItems.map((item) => (
                <div key={item.id} className="relative group">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(item.id);
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1 hover:no-underline ${
                      activeSection === item.id
                        ? "bg-orcaa-blue text-white"
                        : "text-orcaa-blue hover:bg-orcaa-blue hover:text-white border border-orcaa-blue"
                    }`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown className="h-4 w-4" />}
                  </a>
                  
                  {/* Dropdown for Mappings */}
                  {item.submenu && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        {item.submenu.map((subItem) => (
                          <a
                            key={subItem.id}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveSection("mappings");
                              setActiveMappingSection(subItem.id);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:no-underline ${
                              activeSection === "mappings" && activeMappingSection === subItem.id
                                ? "bg-orcaa-blue text-white"
                                : "text-orcaa-blue hover:bg-orcaa-blue hover:text-white"
                            }`}
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Content Area */}
            <div className="mt-6">
              {renderContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}