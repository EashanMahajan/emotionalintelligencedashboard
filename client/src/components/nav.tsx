import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Nav() {
  const [location, setLocation] = useLocation();
  const { username, logout } = useAuth();

  const go = (path: string) => () => setLocation(path);

  const handleLogout = () => {
    logout();
    setLocation("/signin");
  };

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">
          Emotional Intelligence AI
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={location === "/dashboard" || location.startsWith("/results") ? "default" : "outline"}
            onClick={go("/dashboard")}
          >
            Dashboard
          </Button>

          <Button
            variant={location === "/upload" ? "default" : "outline"}
            onClick={go("/upload")}
          >
            Upload
          </Button>

          <Button
            variant={location === "/history" ? "default" : "outline"}
            onClick={go("/history")}
          >
            History
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{username}</span>
                  <span className="text-xs text-muted-foreground">Signed in</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
