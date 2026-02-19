import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DashboardOverview from "@/pages/dashboard-overview";
import UploadPage from "@/pages/upload";
import HistoryPage from "@/pages/history";
import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/signin";
import SignUpPage from "@/pages/signup";
import TryPage from "@/pages/try";
import TrialDashboard from "@/pages/trial-dashboard";
import Nav from "@/components/nav";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/signin" component={SignInPage} />
      <Route path="/signup" component={SignUpPage} />
      
      {/* Trial mode routes - no auth required */}
      <Route path="/try" component={TryPage} />
      <Route path="/try/results/:id" component={TrialDashboard} />
      
      {/* Landing page - redirects authenticated users to dashboard */}
      <Route 
        path="/" 
        component={() => {
          if (isAuthenticated) {
            return <Redirect to="/dashboard" />;
          }
          return <LandingPage />;
        }} 
      />
      
      {/* Protected routes */}
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
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
