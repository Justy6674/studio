"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, hasActiveSubscription, isSubscriptionLoading, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect logic after successful login
  useEffect(() => {
    if (user && !isSubscriptionLoading) {
      if (hasActiveSubscription()) {
        router.push("/dashboard");
      } else {
        router.push("/billing");
      }
    }
  }, [user, hasActiveSubscription, isSubscriptionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password, staySignedIn);
      toast({
        title: "Welcome back! 👋",
        description: "Successfully signed in to Water4WeightLoss.",
      });
    } catch (error) {
      console.error("Login error:", error);
      const firebaseError = error as { code: string };
      setError(getErrorMessage(firebaseError.code));
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: getErrorMessage(firebaseError.code),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      default:
        return "Login failed. Please check your credentials and try again.";
    }
  };

  // Show skeleton loader while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Skeleton className="w-20 h-20 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-8 w-40 mx-auto" />
              <Skeleton className="h-5 w-56 mx-auto mt-2" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Skeleton className="h-5 w-48 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 relative rounded-xl overflow-hidden border-2 border-hydration-400 shadow-lg bg-hydration-500/10">
              <Image
                src="/Logo (1).png"
                alt="Water4WeightLoss Logo"
                fill
                className="object-cover"
                priority
                sizes="80px"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-100">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to continue your hydration journey
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-900/20 border-red-700">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 pr-10"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="staySignedIn"
                checked={staySignedIn}
                onCheckedChange={(checked) => setStaySignedIn(!!checked)}
                disabled={isLoading}
                className="border-slate-600 data-[state=checked]:bg-hydration-500"
              />
              <Label htmlFor="staySignedIn" className="text-slate-300 text-sm">
                Stay signed in
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-hydration-500 hover:bg-hydration-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-hydration-400 hover:text-hydration-300 underline">
              Sign up here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
