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
import EmailTemplateConfig from "./EmailTemplateConfig";

export default function ApplicationManagement() {
  const [activeSection, setActiveSection] = useState("users");
  const [activeMappingSection, setActiveMappingSection] = useState("user-role");

  const updateHash = (section: string, subsection?: string) => {
    if (subsection) {
      window.location.hash = subsection;
    } else {
      window.location.hash = section;
    }
  };



  const menuItems = [
    { id: "users", label: "User Management", component: UserManagement },
    { id: "roles", label: "Role Management", component: RoleManagement },
    { id: "list-values", label: "List Values", component: ListValueManagement },
    { id: "workflow", label: "Workflow Designer", component: WorkflowDesigner },
    { id: "templates", label: "Workflow Templates", component: WorkflowTemplates },
    { id: "email-templates", label: "Email Templates", component: EmailTemplateConfig },
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

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const menuItem = menuItems.find(item => item.id === hash);
        if (menuItem) {
          setActiveSection(hash);
        } else if (hash === "user-role" || hash === "role-action") {
          setActiveSection("mappings");
          setActiveMappingSection(hash);
        }
      }
    };

    // Check initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.submenu ? (
                <div className="relative group">
                  <button
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeSection === item.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setActiveSection(item.id);
                      updateHash(item.id);
                    }}
                  >
                    {item.label}
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  </button>
                  {activeSection === item.id && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            activeMappingSection === subItem.id ? "bg-blue-50 text-blue-600" : "text-gray-700"
                          }`}
                          onClick={() => {
                            setActiveMappingSection(subItem.id);
                            updateHash(item.id, subItem.id);
                          }}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSection === item.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setActiveSection(item.id);
                    updateHash(item.id);
                  }}
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {renderNavigation()}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}