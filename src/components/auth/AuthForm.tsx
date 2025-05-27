"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplets, User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isLogin = mode === "login";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleMode = () => {
    const newMode = isLogin ? "signup" : "login";
    router.push(`/${newMode}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

        // Create user profile in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: formData.name,
          email: formData.email,
          hydrationGoal: 2000,
          createdAt: new Date(),
          dailyStreak: 0,
          longestStreak: 0,
        });

        router.push("/dashboard");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/90 border-slate-700 shadow-2xl backdrop-blur-sm">
      <CardHeader className="text-center space-y-4">
        {/* Logo */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
          <Image
            src="/logo-128.png"
            alt="Water4WeightLoss"
            width={48}
            height={48}
            className="rounded-lg"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl"></div>
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-100">
            {isLogin ? "Welcome Back!" : "Start Your Journey"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {isLogin 
              ? "Continue your hydration journey with HydrateAI" 
              : "Join thousands achieving their hydration goals"
            }
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
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
                placeholder="your@email.com"
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
      </CardContent>

      {/* Features Highlight */}
      <div className="px-6 pb-6">
        <div className="text-center">
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
    </Card>
  );
}