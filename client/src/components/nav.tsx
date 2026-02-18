import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLatestJob } from "@/hooks/use-latest-job";

export default function Nav() {
  const [location, setLocation] = useLocation();
  const { data: latestJob } = useLatestJob(); // ← THIS WAS MISSING

  const go = (path: string) => () => setLocation(path);

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">
          Emotional Intelligence AI
        </div>

        <div className="flex gap-2">
          <Button
            variant={location.startsWith("/results") ? "default" : "outline"}
            disabled={!latestJob?.id}
            onClick={() => {
              if (latestJob?.id) {
                setLocation(`/results/${latestJob.id}`);
              }
            }}
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
