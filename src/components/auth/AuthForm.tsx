
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#334155' }}>
      <div className="w-full max-w-md">
        <Card className="shadow-2xl overflow-hidden" style={{ backgroundColor: '#1E293B', borderColor: '#b68a71', borderWidth: '2px' }}>
          <CardHeader className="text-center space-y-6 pt-8 pb-6">
            {/* Logo */}
            <div className="mx-auto">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5271FF 0%, #4061e0 100%)' }}>
                <Image
                  src="/logo-128.png"
                  alt="Water4WeightLoss"
                  width={56}
                  height={56}
                  className="rounded-2xl"
                  priority
                />
                <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%)' }}></div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#F7F2D3' }}>
                {isLogin ? "Welcome Back!" : "Start Your Journey"}
              </h1>
              <p className="text-lg font-medium" style={{ color: '#b68a71' }}>
                {isLogin ? "Hydration Champion" : "Join thousands achieving their hydration goals"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {/* Error Alert */}
            {error && (
              <Alert className="border-2" style={{ backgroundColor: 'rgba(127, 29, 29, 0.8)', borderColor: '#ef4444' }}>
                <AlertDescription className="font-medium" style={{ color: '#fecaca' }}>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field (Sign Up Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-sm" style={{ color: '#F7F2D3' }}>
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#b68a71' }} />
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your full name"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-12 h-14 border-2 text-lg rounded-xl focus:ring-2 focus:ring-opacity-30"
                      style={{ 
                        backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                        borderColor: '#b68a71', 
                        color: '#F7F2D3',
                        '--tw-ring-color': '#5271FF'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-sm" style={{ color: '#F7F2D3' }}>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#b68a71' }} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-12 h-14 border-2 text-lg rounded-xl focus:ring-2 focus:ring-opacity-30"
                    style={{ 
                      backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                      borderColor: '#b68a71', 
                      color: '#F7F2D3',
                      '--tw-ring-color': '#5271FF'
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-sm" style={{ color: '#F7F2D3' }}>
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#b68a71' }} />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-12 pr-12 h-14 border-2 text-lg rounded-xl focus:ring-2 focus:ring-opacity-30"
                    style={{ 
                      backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                      borderColor: '#b68a71', 
                      color: '#F7F2D3',
                      '--tw-ring-color': '#5271FF'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                    style={{ color: '#b68a71' }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-semibold text-sm" style={{ color: '#F7F2D3' }}>
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#b68a71' }} />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-12 pr-12 h-14 border-2 text-lg rounded-xl focus:ring-2 focus:ring-opacity-30"
                      style={{ 
                        backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                        borderColor: '#b68a71', 
                        color: '#F7F2D3',
                        '--tw-ring-color': '#5271FF'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                      style={{ color: '#b68a71' }}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Stay Logged In Toggle */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="stay-logged-in" className="font-semibold text-sm" style={{ color: '#F7F2D3' }}>
                  Stay logged in
                </Label>
                <Switch
                  id="stay-logged-in"
                  checked={stayLoggedIn}
                  onCheckedChange={setStayLoggedIn}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-16 font-bold text-xl rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{ 
                  backgroundColor: '#5271FF', 
                  color: '#F7F2D3',
                  '--tw-shadow-color': 'rgba(82, 113, 255, 0.25)'
                }}
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
                <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#b68a71' }}>
                  <Fingerprint className="h-4 w-4" />
                  Biometric login supported
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2" style={{ borderColor: 'rgba(182, 138, 113, 0.3)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="px-4 font-bold tracking-wider" style={{ backgroundColor: '#1E293B', color: '#b68a71' }}>OR</span>
              </div>
            </div>

            {/* Subscription Link */}
            <Button
              onClick={openSubscription}
              variant="outline"
              className="w-full h-14 border-2 transition-all duration-300 text-lg font-semibold rounded-xl"
              style={{ 
                borderColor: '#5271FF', 
                color: '#5271FF' 
              }}
            >
              <ExternalLink className="mr-3 h-5 w-5" />
              Not a member? Subscribe for $4.99/month
            </Button>

            {/* Toggle Mode */}
            <div className="text-center pt-4">
              <button
                onClick={toggleMode}
                type="button"
                className="font-semibold text-lg transition-colors duration-200 hover:underline"
                style={{ color: '#5271FF' }}
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
          <div className="inline-flex items-center justify-center space-x-8" style={{ color: 'rgba(247, 242, 211, 0.8)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: '#5271FF' }}></div>
              <span className="font-medium">AI Coaching</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: '#5271FF' }}></div>
              <span className="font-medium">Smart Reminders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: '#5271FF' }}></div>
              <span className="font-medium">Progress Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
