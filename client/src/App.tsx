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

// AUTH BYPASS: ProtectedRoute is temporarily a passthrough for demo mode.
// To re-enable auth: restore the isAuthenticated check from the original.
function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  return <Component />;
}

// AUTH BYPASS: Router sends "/" directly to DashboardOverview.
// All auth pages (signin, signup, landing, try) are preserved and just unreachable for now.
// To re-enable: restore the original Router with isAuthenticated checks.
function Router() {
  return (
    <Switch>
      {/* Previously auth-gated routes — now open for demo */}
      <Route path="/" component={DashboardOverview} />
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/results/:id" component={Dashboard} />

      {/* Auth + trial pages preserved but unreachable in demo mode */}
      {/* <Route path="/signin" component={SignInPage} /> */}
      {/* <Route path="/signup" component={SignUpPage} /> */}
      {/* <Route path="/try" component={TryPage} /> */}
      {/* <Route path="/try/results/:id" component={TrialDashboard} /> */}

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // AUTH BYPASS: Nav always shown. To re-enable: wrap with `isAuthenticated &&`
  return (
    <>
      <Nav />
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
