import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DashboardOverview from "@/pages/dashboard-overview";
import UploadPage from "@/pages/upload";
import HistoryPage from "@/pages/history";
import SignInPage from "@/pages/signin";
import Nav from "@/components/nav";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/signin" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/signin" component={SignInPage} />
      <Route path="/" component={() => <Redirect to={isAuthenticated ? "/dashboard" : "/signin"} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardOverview} />} />
      <Route path="/upload" component={() => <ProtectedRoute component={UploadPage} />} />
      <Route path="/history" component={() => <ProtectedRoute component={HistoryPage} />} />
      <Route path="/results/:id" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Nav />}
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
