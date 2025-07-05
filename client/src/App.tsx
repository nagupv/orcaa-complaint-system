import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Inbox from "@/pages/Inbox";
import TimesheetManagement from "@/pages/TimesheetManagement";
import TimeEntries from "@/pages/TimeEntries";
import LeaveRequests from "@/pages/LeaveRequests";
import OvertimeRequests from "@/pages/OvertimeRequests";
import AuditTrail from "@/pages/AuditTrail";
import ApplicationManagement from "@/pages/ApplicationManagement";
import UserManagement from "@/pages/UserManagement";
import RoleManagement from "@/pages/RoleManagement";
import ListValueManagement from "@/pages/ListValueManagement";
import WorkflowDesigner from "@/pages/WorkflowDesigner";
import WorkflowTemplates from "@/pages/WorkflowTemplates";
import UserRoleMapping from "@/pages/UserRoleMapping";
import RoleActionMapping from "@/pages/RoleActionMapping";
import UserRoleReport from "@/pages/UserRoleReport";
import ServiceSelection from "@/pages/ServiceSelection";
import ComplaintForm from "@/pages/ComplaintForm";
import DemolitionForm from "@/pages/DemolitionForm";
import ComplaintSearch from "@/pages/ComplaintSearch";
import EnhancedComplaintSearch from "@/pages/EnhancedComplaintSearch";
import Help from "@/pages/Help";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/services" component={ServiceSelection} />
          <Route path="/search" component={ComplaintSearch} />
          <Route path="/submit/air_quality" component={ComplaintForm} />
          <Route path="/submit/demolition_notice" component={DemolitionForm} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inbox" component={Inbox} />
          <Route path="/time-management" component={TimesheetManagement} />
          <Route path="/time-entries" component={TimeEntries} />
          <Route path="/leave-requests" component={LeaveRequests} />
          <Route path="/overtime-requests" component={OvertimeRequests} />
          <Route path="/audit-trail" component={AuditTrail} />
          <Route path="/application-management" component={ApplicationManagement} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/role-management" component={RoleManagement} />
          <Route path="/list-values" component={ListValueManagement} />
          <Route path="/workflow-designer" component={WorkflowDesigner} />
          <Route path="/workflow-templates" component={WorkflowTemplates} />
          <Route path="/user-role-mapping" component={UserRoleMapping} />
          <Route path="/role-action-mapping" component={RoleActionMapping} />
          <Route path="/user-role-report" component={UserRoleReport} />
          <Route path="/enhanced-search" component={EnhancedComplaintSearch} />
          <Route path="/help" component={Help} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
