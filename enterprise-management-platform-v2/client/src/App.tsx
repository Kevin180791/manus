import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AISettings from "./pages/AISettings";
import TimeTracking from "@/pages/TimeTracking";
import TimeCalendar from "@/pages/TimeCalendar";
import TeamDashboard from "@/pages/TeamDashboard";
import Employees from "./pages/Employees";
import Inventory from "./pages/Inventory";
import InventoryAssignments from "./pages/InventoryAssignments";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Documents from "./pages/Documents";
import Measurements from "./pages/Measurements";
import Capacity from "./pages/Capacity";

import DailyReports from "./pages/DailyReports";
import DailyReportDetail from "./pages/DailyReportDetail";
import InspectionProtocols from "./pages/InspectionProtocols";
import DefectProtocols from "./pages/DefectProtocols";

function Router() {
  // v5d5d65d4-FINAL-NOTIFICATION-FIX - Alle Notification-Dateien und Importe entfernt
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/employees"} component={Employees} />
        <Route path="/ai-settings" component={AISettings} />
        <Route path="/time-tracking" component={TimeTracking} />
      <Route path="/time-calendar" component={TimeCalendar} />
      <Route path="/team-dashboard" component={TeamDashboard} />
        <Route path={"/inventory"} component={Inventory} />
        <Route path={"/assignments"} component={InventoryAssignments} />
        <Route path={"/projects"} component={Projects} />
        <Route path={"/projects/:id"} component={ProjectDetail} />
        <Route path={"/documents"} component={Documents} />
        <Route path={"/measurements"} component={Measurements} />
        <Route path={"/capacity"} component={Capacity} />

        <Route path="/daily-reports" component={DailyReports} />
      <Route path="/daily-reports/:id" component={DailyReportDetail} />
        <Route path={"/inspection-protocols"} component={InspectionProtocols} />
        <Route path={"/defect-protocols"} component={DefectProtocols} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;


