import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Nav() {
  const [location, setLocation] = useLocation();

  const go = (path: string) => () => setLocation(path);

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">
          Emotional Intelligence AI
        </div>

        <div className="flex gap-2">
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
        </div>
      </div>
    </header>
  );
}
