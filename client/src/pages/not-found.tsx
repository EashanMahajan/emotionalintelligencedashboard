import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive opacity-20" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
        <p className="text-muted-foreground text-lg">Page not found</p>
        <Link href="/">
          <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Return Home
          </a>
        </Link>
      </div>
    </div>
  );
}
