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
import EnhancedInbox from "@/pages/EnhancedInbox";
import TimesheetManagement from "@/pages/TimesheetManagement";
import TimeEntries from "@/pages/TimeEntries";
import LeaveRequests from "@/pages/LeaveRequests";
import OvertimeRequests from "@/pages/OvertimeRequests";
import AuditTrail from "@/pages/AuditTrail";
import ApplicationManagement from "@/pages/ApplicationManagement";
import ServiceSelection from "@/pages/ServiceSelection";
import ComplaintForm from "@/pages/ComplaintForm";
import DemolitionForm from "@/pages/DemolitionForm";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/services" component={ServiceSelection} />
          <Route path="/submit/air_quality" component={ComplaintForm} />
          <Route path="/submit/demolition_notice" component={DemolitionForm} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inbox" component={EnhancedInbox} />
          <Route path="/time-management" component={TimesheetManagement} />
          <Route path="/time-entries" component={TimeEntries} />
          <Route path="/leave-requests" component={LeaveRequests} />
          <Route path="/overtime-requests" component={OvertimeRequests} />
          <Route path="/audit-trail" component={AuditTrail} />
          <Route path="/application-management" component={ApplicationManagement} />
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
