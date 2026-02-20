import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, Moon, Sun, User, LayoutDashboard, UploadCloud, History } from "lucide-react";
import { ResonanceLogo } from "@/components/ResonanceLogo";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, match: (l: string) => l === "/" || l === "/dashboard" || l.startsWith("/results") },
  { label: "New Analysis", path: "/upload", icon: UploadCloud, match: (l: string) => l === "/upload" },
  { label: "History", path: "/history", icon: History, match: (l: string) => l === "/history" },
];

export default function Nav() {
  const [location, setLocation] = useLocation();
  const { username, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isDark = resolvedTheme === "dark";

  return (
    <header className="w-full sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14">
        {/* Logo */}
        <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 group">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5 group-hover:bg-primary/20 transition-colors">
            <ResonanceLogo className="w-4 h-4 text-primary" />
          </div>
          <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
        </button>

        {/* Pill nav */}
        <nav className="hidden sm:flex items-center bg-muted/50 border border-border/50 rounded-xl px-1.5 py-1.5 gap-0.5">
          {navLinks.map(({ label, path, icon: Icon, match }) => {
            const active = match(location);
            return (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-background text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", active && "text-primary")} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User dropdown — hidden in demo mode (no auth) */}
          {username ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">{username}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5 py-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{username}</span>
                    <span className="text-xs text-muted-foreground">Signed in</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-400 cursor-pointer gap-2 focus:text-rose-400 focus:bg-rose-500/10">
                <LogOut className="w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : (
          /* Demo mode placeholder — matches auth box visually, no interaction */
          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border/60 bg-muted/30 cursor-default select-none">
            <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="hidden sm:inline text-sm font-medium text-muted-foreground">Demo User</span>
          </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="sm:hidden flex border-t border-border/50">
        {navLinks.map(({ label, path, icon: Icon, match }) => {
          const active = match(location);
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
