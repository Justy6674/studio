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
import { Droplets, Eye, EyeOff, Loader2, Mail, User, Lock } from "lucide-react";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchUserProfile } = useAuthContext();

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        await fetchUserProfile(userCredential.user);
        toast({ 
          title: "Welcome back!", 
          description: "Ready to continue your hydration journey?" 
        });
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

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

        await fetchUserProfile(user);
        toast({ 
          title: "Welcome aboard!", 
          description: "Your hydration journey starts now! 💧" 
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please try again.");
      toast({
        variant: "destructive",
        title: "Oops! Something went wrong",
        description: err.message || "Please check your details and try again.",
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
    <div className="w-full max-w-md">
      {/* Auth Card */}
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
              <Droplets className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {isLogin ? "Welcome Back!" : "Join the Flow"}
          </h2>
          <p className="text-slate-400">
            {isLogin 
              ? "Ready to continue your hydration journey?" 
              : "Start tracking your water intake like a true Aussie"
            }
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-500/50">
            <Droplets className="h-4 w-4" />
            <AlertTitle>Oops!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field (Sign Up Only) */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                className="pl-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isLogin ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              <>
                <Droplets className="mr-2 h-5 w-5" />
                {isLogin ? "Dive In" : "Start Your Journey"}
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-3 text-slate-400 font-medium">Or</span>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="text-center">
          <button
            onClick={toggleMode}
            type="button"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
          >
            {isLogin 
              ? "New here? Create an account →" 
              : "Already have an account? Sign in →"
            }
          </button>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-6 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>AI Coaching</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Smart Reminders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Progress Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}