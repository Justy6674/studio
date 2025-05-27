
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
import { Mail, Lock, Eye, EyeOff, Loader2, ExternalLink, User, Fingerprint } from "lucide-react";
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
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
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
      if (stayLoggedIn) {
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
      <div className="w-full max-w-md">
        <Card className="bg-[#1E293B] border-[#b68a71] border-2 shadow-2xl overflow-hidden">
          <CardHeader className="text-center space-y-6 pt-8 pb-6">
            {/* Logo */}
            <div className="mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-[#5271FF] to-[#4061e0] rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden">
                <Image
                  src="/logo-128.png"
                  alt="Water4WeightLoss"
                  width={56}
                  height={56}
                  className="rounded-2xl"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 rounded-3xl"></div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-[#F7F2D3] tracking-tight">
                {isLogin ? "Welcome Back!" : "Start Your Journey"}
              </h1>
              <p className="text-[#b68a71] text-lg font-medium">
                {isLogin ? "Hydration Champion" : "Join thousands achieving their hydration goals"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-950/80 border-red-500 border-2">
                <AlertDescription className="text-red-200 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field (Sign Up Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#F7F2D3] font-semibold text-sm">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#b68a71]" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your full name"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-12 h-14 bg-[#334155]/50 border-[#b68a71] border-2 text-[#F7F2D3] placeholder:text-[#b68a71]/60 focus:border-[#5271FF] focus:ring-2 focus:ring-[#5271FF]/30 text-lg rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F7F2D3] font-semibold text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#b68a71]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-12 h-14 bg-[#334155]/50 border-[#b68a71] border-2 text-[#F7F2D3] placeholder:text-[#b68a71]/60 focus:border-[#5271FF] focus:ring-2 focus:ring-[#5271FF]/30 text-lg rounded-xl"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#F7F2D3] font-semibold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#b68a71]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-12 pr-12 h-14 bg-[#334155]/50 border-[#b68a71] border-2 text-[#F7F2D3] placeholder:text-[#b68a71]/60 focus:border-[#5271FF] focus:ring-2 focus:ring-[#5271FF]/30 text-lg rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#b68a71] hover:text-[#F7F2D3] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#F7F2D3] font-semibold text-sm">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#b68a71]" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-12 pr-12 h-14 bg-[#334155]/50 border-[#b68a71] border-2 text-[#F7F2D3] placeholder:text-[#b68a71]/60 focus:border-[#5271FF] focus:ring-2 focus:ring-[#5271FF]/30 text-lg rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#b68a71] hover:text-[#F7F2D3] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Stay Logged In Toggle */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="stay-logged-in" className="text-[#F7F2D3] font-semibold text-sm">
                  Stay logged in
                </Label>
                <Switch
                  id="stay-logged-in"
                  checked={stayLoggedIn}
                  onCheckedChange={setStayLoggedIn}
                  className="data-[state=checked]:bg-[#5271FF] data-[state=unchecked]:bg-[#334155]"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-16 bg-[#5271FF] hover:bg-[#4061e0] text-[#F7F2D3] font-bold text-xl rounded-xl shadow-2xl hover:shadow-[#5271FF]/25 transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Go to Dashboard" : "Start Your Journey"}
                  </>
                )}
              </Button>
            </form>

            {/* Biometric Support Indicator */}
            {biometricSupported && isLogin && (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 text-[#b68a71] text-sm font-medium">
                  <Fingerprint className="h-4 w-4" />
                  Biometric login supported
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#b68a71]/30"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-[#1E293B] px-4 text-[#b68a71] font-bold tracking-wider">OR</span>
              </div>
            </div>

            {/* Subscription Link */}
            <Button
              onClick={openSubscription}
              variant="outline"
              className="w-full h-14 border-2 border-[#5271FF] text-[#5271FF] hover:bg-[#5271FF] hover:text-[#F7F2D3] transition-all duration-300 text-lg font-semibold rounded-xl"
            >
              <ExternalLink className="mr-3 h-5 w-5" />
              Not a member? Subscribe for $4.99/month
            </Button>

            {/* Toggle Mode */}
            <div className="text-center pt-4">
              <button
                onClick={toggleMode}
                type="button"
                className="text-[#5271FF] hover:text-[#4061e0] font-semibold text-lg transition-colors duration-200 hover:underline"
              >
                {isLogin 
                  ? "New here? Create an account →" 
                  : "Already have an account? Sign in →"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* App Features */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center space-x-8 text-[#F7F2D3]/80">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#5271FF] rounded-full shadow-lg"></div>
              <span className="font-medium">AI Coaching</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#5271FF] rounded-full shadow-lg"></div>
              <span className="font-medium">Smart Reminders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#5271FF] rounded-full shadow-lg"></div>
              <span className="font-medium">Progress Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
