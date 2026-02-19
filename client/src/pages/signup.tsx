import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Fake submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // This is a fake page - doesn't actually create an account
    toast({
      title: "Account creation is not available",
      description: "This is a demo application. Please use the sign-in page with existing credentials.",
      variant: "default",
    });

    setIsSubmitting(false);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Sign up to start analyzing conversations
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange("username")}
                disabled={isSubmitting}
                required
                autoComplete="username"
                className="h-11"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange("email")}
                disabled={isSubmitting}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange("password")}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            {/* Info Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 p-3 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                This is a demo application. Account creation is not available. Please use the sign-in page with existing credentials.
              </span>
            </motion.div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || !formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/signin")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
