import { Link } from "react-router";
import { Home, ArrowLeft, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mb-6">
        <HandCoins className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-2">Page Not Found</p>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
        <Link to="/">
          <Button className="gradient-accent gap-2">
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
