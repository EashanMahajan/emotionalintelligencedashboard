import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import UploadPage from "@/pages/upload";
import HistoryPage from "@/pages/history";
import Nav from "@/components/nav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/upload" />} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/results/:id" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Nav />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
