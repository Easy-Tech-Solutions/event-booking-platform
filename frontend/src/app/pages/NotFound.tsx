import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Home, Search } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-purple-600 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-700"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/discover")}
          >
            <Search className="w-5 h-5 mr-2" />
            Discover Events
          </Button>
        </div>
      </div>
    </div>
  );
}
