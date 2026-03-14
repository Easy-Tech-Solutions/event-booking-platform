import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Ticket } from "lucide-react";

export function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: navigate to user dashboard on submit
    navigate("/user/tickets");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#004406] p-3 rounded-xl mb-3">
              <Ticket className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Sign in to EventHub</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Password</Label>
                <Link to="/help" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up free
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/user/tickets" className="text-sm text-primary hover:underline">
              Find my tickets without signing in →
            </Link>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
