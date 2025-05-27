
<old_str>"use client";

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
}</old_str>
<new_str>"use client";

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
import { Droplets, AlertCircle, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";

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
        toast({ title: "Welcome back!", description: "Ready to continue your hydration journey?" });
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: formData.name,
          hydrationGoal: 2000,
          dailyStreak: 0,
          longestStreak: 0,
          reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
          createdAt: new Date().toISOString(),
        });
        await fetchUserProfile(user);
        toast({ title: "Welcome to Water4WeightLoss!", description: "Let's start your hydration journey!" });
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header with Logo and Branding */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Image
                src="/logo-128.png"
                alt="Water4WeightLoss Logo"
                width={80}
                height={80}
                className="rounded-2xl shadow-2xl border-2 border-blue-500/20"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Water4WeightLoss
            </h1>
            <p className="text-xl text-slate-300 font-medium">HydrateAI</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-200">
              {isLogin ? "Welcome Back" : "Start Your Journey"}
            </h2>
            <p className="text-slate-400">
              {isLogin 
                ? "Continue your hydration journey with AI-powered support" 
                : "Join thousands of Australians achieving their health goals"}
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl space-y-6">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-11 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com.au"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-11 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-11 pr-11 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12"
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

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-11 pr-11 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12"
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

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5" />
                  {isLogin ? "Sign In to HydrateAI" : "Start Your Journey"}
                </div>
              )}
            </Button>
          </form>

          {/* Toggle between login/signup */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 text-slate-400 font-medium">Or</span>
            </div>
          </div>

          <div className="text-center">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors"
              onClick={toggleMode}
              type="button"
            >
              {isLogin ? "New to Water4WeightLoss? Create Account" : "Already have an account? Sign In"}
            </Button>
          </div>

          {/* Australian focused messaging */}
          {!isLogin && (
            <div className="text-center pt-4">
              <p className="text-xs text-slate-500">
                🇦🇺 Built for Australians • AI-Powered Hydration • $4.99 AUD/month
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}</new_str>
