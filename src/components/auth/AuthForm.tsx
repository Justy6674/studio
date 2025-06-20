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
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

import { Logo } from "@/components/ui/logo";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();


  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isLoading, setIsLoading] = useState(false);
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

        toast({ 
          title: "Welcome back!", 
          description: `Signed in successfully as ${userCredential.user.email}` 
        });
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        const userProfile = {
          uid: user.uid,
          email: user.email,
          name: formData.name || user.email?.split('@')[0] || 'User',
          hydrationGoal: 2000,
          dailyStreak: 0,
          longestStreak: 0,
          reminderTimes: { '08:00': true, '12:00': true, '16:00': true, '20:00': true },
          phoneNumber: '',
          smsEnabled: false,
          aiTone: 'motivational',
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, "users", user.uid), userProfile);

        
        toast({ 
          title: `Welcome ${userProfile.name}!`, 
          description: "Account created successfully. Let's start your hydration journey!" 
        });
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err);
      const errorMessage = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-2xl">
        <div className="text-center">
          <Logo size="xl" showText={false} href={undefined} className="justify-center mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {isLogin ? "Welcome Back" : "Join Water4WeightLoss"}
          </h2>
          <p className="text-slate-400 mb-8">
            {isLogin ? "Sign in to continue your hydration journey" : "Start your AI-powered hydration journey today"}
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
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="bg-background"
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
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="bg-background"
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
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
                className="bg-background"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
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
          <Button variant="link" onClick={toggleMode} type="button">
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
          </Button>
        </div>
      </div>
    </main>
  );
}