"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
// Removed Next.js Image import - using direct img tag instead

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchUserProfile } = useAuthContext();

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isLoading, setIsLoading] = useState(false);
  // const [staySignedIn, setStaySignedIn] = useState(false); // Firebase handles this via persistence
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError("Passwords don't match.");
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        await fetchUserProfile(userCredential.user); // Fetch profile after sign in
        toast({ title: "Signed In", description: "Welcome back!" });
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: formData.name,
          hydrationGoal: 2000, // Default goal in ml
          dailyStreak: 0,
          longestStreak: 0,
          reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
          createdAt: new Date().toISOString(),
        });
        await fetchUserProfile(user); // Fetch profile after sign up
        toast({ title: "Account Created", description: "Welcome to Water4WeightLoss!" });
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please try again.");
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    router.push(isLogin ? "/signup" : "/login");
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-2xl">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/logo-128.png"
            alt="Water4WeightLoss"
            width="80"
            height="80"
            className="rounded-xl w-20 h-20 object-contain"
            onLoad={() => console.log('✅ Logo loaded successfully!')}
            onError={(e) => {
              console.error('❌ Logo failed to load from /logo-128.png');
              // Immediate fallback
              e.currentTarget.outerHTML = '<div class="w-20 h-20 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl">W4W</div>';
            }}
          />
        </div>
        <h1 className="text-3xl font-bold text-primary">
          {isLogin ? "Welcome Back to Water4WeightLoss" : "Join Water4WeightLoss"}
        </h1>
        <p className="text-muted-foreground">
          {isLogin ? "Sign in to continue your hydration journey." : "Create an account to start tracking."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your Name"
              required={!isLogin}
              value={formData.name}
              onChange={handleChange}
              className="bg-background placeholder:text-muted-foreground"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            value={formData.email}
            onChange={handleChange}
            className="bg-background placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            value={formData.password}
            onChange={handleChange}
            className="bg-background placeholder:text-muted-foreground"
          />
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required={!isLogin}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-background placeholder:text-muted-foreground"
            />
          </div>
        )}

        {/* Removed "Stay signed in" as Firebase handles persistence by default 
            See: https://firebase.google.com/docs/auth/web/auth-state-persistence
        */}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="text-center text-sm">
        <Button 
          variant="link" 
          className="text-primary hover:text-primary/90"
          onClick={toggleMode}
          type="button"
        >
          {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </Button>
      </div>
    </div>
  );
}