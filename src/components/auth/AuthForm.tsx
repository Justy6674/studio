
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Droplets, Mail, Lock, Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";
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
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricSupported, setBiometricSupported] = useState(false);
  const router = useRouter();

  const isLogin = mode === "login";

  useEffect(() => {
    // Check for biometric support
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setBiometricSupported(true);
    }
  }, []);

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
      // Set persistence based on user preference
      if (keepLoggedIn) {
        await setPersistence(auth, browserLocalPersistence);
      }

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
      setError(error.message || "An error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const openSubscription = () => {
    window.open("https://buy.stripe.com/7sIg1FgK8fPv5hGaEF", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#334155] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#1E293B] border-slate-600 shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-8">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#5271FF] to-[#4061e0] rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
            <Image
              src="/logo-128.png"
              alt="Water4WeightLoss"
              width={48}
              height={48}
              className="rounded-lg"
              priority
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#F7F2D3]">
              {isLogin ? "Welcome Back!" : "Start Your Journey"}
            </h1>
            <p className="text-slate-400 text-lg">
              {isLogin ? "Hydration Champion" : "Join thousands achieving their hydration goals"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-950/50 border-red-500/50">
              <Droplets className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#F7F2D3] font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-[#F7F2D3] placeholder:text-slate-400 focus:border-[#5271FF] focus:ring-[#5271FF]/20 h-12"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#F7F2D3] font-medium">
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
                  className="pl-10 bg-slate-700/50 border-slate-600 text-[#F7F2D3] placeholder:text-slate-400 focus:border-[#5271FF] focus:ring-[#5271FF]/20 h-12"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#F7F2D3] font-medium">
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
                  className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-[#F7F2D3] placeholder:text-slate-400 focus:border-[#5271FF] focus:ring-[#5271FF]/20 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#F7F2D3] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#F7F2D3] font-medium">
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
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-[#F7F2D3] placeholder:text-slate-400 focus:border-[#5271FF] focus:ring-[#5271FF]/20 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#F7F2D3] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Keep Logged In Toggle */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <Label htmlFor="keep-logged-in" className="text-[#F7F2D3] font-medium">
                  Keep me logged in
                </Label>
                <Switch
                  id="keep-logged-in"
                  checked={keepLoggedIn}
                  onCheckedChange={setKeepLoggedIn}
                  className="data-[state=checked]:bg-[#5271FF]"
                />
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 bg-[#5271FF] hover:bg-[#4061e0] text-[#F7F2D3] font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  <Droplets className="mr-2 h-6 w-6" />
                  {isLogin ? "Go to Dashboard" : "Start Your Journey"}
                </>
              )}
            </Button>
          </form>

          {/* Biometric Support Indicator */}
          {biometricSupported && isLogin && (
            <div className="text-center">
              <p className="text-sm text-slate-400">
                🔐 Biometric login supported on this device
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1E293B] px-3 text-slate-400 font-medium">Or</span>
            </div>
          </div>

          {/* Subscription Link */}
          <Button
            onClick={openSubscription}
            variant="outline"
            className="w-full h-12 border-[#5271FF] text-[#5271FF] hover:bg-[#5271FF]/10 hover:text-[#F7F2D3] transition-all duration-200"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Not a member? Subscribe for $4.99/month
          </Button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              onClick={toggleMode}
              type="button"
              className="text-[#5271FF] hover:text-[#4061e0] font-medium transition-colors duration-200"
            >
              {isLogin 
                ? "New here? Create an account →" 
                : "Already have an account? Sign in →"
              }
            </button>
          </div>
        </CardContent>

        {/* App Features */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <div className="inline-flex items-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#5271FF] rounded-full"></div>
                <span>AI Coaching</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#5271FF] rounded-full"></div>
                <span>Smart Reminders</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#5271FF] rounded-full"></div>
                <span>Progress Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
