
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2, ExternalLink, Fingerprint } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricSupported, setBiometricSupported] = useState(false);
  const router = useRouter();

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (stayLoggedIn) {
        await setPersistence(auth, browserLocalPersistence);
      }

      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      router.push("/dashboard");
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
        <Card className="shadow-2xl overflow-hidden rounded-2xl" style={{ backgroundColor: '#1e293b', borderColor: '#b68a71', borderWidth: '2px' }}>
          <CardHeader className="text-center space-y-6 pt-8 pb-6">
            {/* Logo */}
            <div className="mx-auto">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5271FF 0%, #4061e0 100%)' }}>
                <Image
                  src="/logo-128.png"
                  alt="Water4WeightLoss"
                  width={64}
                  height={64}
                  className="rounded-2xl"
                  priority
                />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#F7F2D3' }}>
                Welcome Back!
              </h1>
              <p className="text-lg font-medium" style={{ color: '#b68a71' }}>
                Ready to track your hydration
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <Alert className="border-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' }}>
                <AlertDescription className="font-medium" style={{ color: '#fecaca' }}>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="pl-12 h-14 border-2 text-lg rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: '#334155', 
                      borderColor: '#b68a71', 
                      color: '#F7F2D3'
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
                    className="pl-12 pr-12 h-14 border-2 text-lg rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: '#334155', 
                      borderColor: '#b68a71', 
                      color: '#F7F2D3'
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

              {/* Stay Logged In Toggle */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="stay-logged-in" className="font-semibold text-sm" style={{ color: '#F7F2D3' }}>
                  Stay logged in
                </Label>
                <Switch
                  id="stay-logged-in"
                  checked={stayLoggedIn}
                  onCheckedChange={setStayLoggedIn}
                  style={{ '--tw-accent-color': '#5271FF' } as any}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-16 font-bold text-xl rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: '#5271FF', 
                  color: '#F7F2D3'
                }}
                disabled={isLoading}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4061e0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5271FF'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Go to Dashboard"
                )}
              </Button>
            </form>

            {/* Biometric Support */}
            {biometricSupported && (
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
                <span className="px-4 font-bold tracking-wider" style={{ backgroundColor: '#1e293b', color: '#b68a71' }}>OR</span>
              </div>
            </div>

            {/* Subscription Link */}
            <Button
              onClick={openSubscription}
              variant="outline"
              className="w-full h-14 border-2 transition-all duration-300 text-lg font-semibold rounded-xl hover:bg-opacity-10"
              style={{ 
                borderColor: '#5271FF', 
                color: '#5271FF',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(82, 113, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ExternalLink className="mr-3 h-5 w-5" />
              Not a member? Subscribe for $4.99/month
            </Button>

            {/* Toggle Mode */}
            <div className="text-center pt-4">
              <button
                onClick={() => router.push('/signup')}
                type="button"
                className="font-semibold text-lg transition-colors duration-200 hover:underline"
                style={{ color: '#5271FF' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4061e0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5271FF'}
              >
                New here? Create an account →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* App Features */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center space-x-8" style={{ color: 'rgba(247, 242, 211, 0.8)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full shadow-lg animate-pulse" style={{ backgroundColor: '#5271FF' }}></div>
              <span className="font-medium">AI Coaching</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full shadow-lg animate-pulse" style={{ backgroundColor: '#5271FF', animationDelay: '0.5s' }}></div>
              <span className="font-medium">Smart Reminders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full shadow-lg animate-pulse" style={{ backgroundColor: '#5271FF', animationDelay: '1s' }}></div>
              <span className="font-medium">Progress Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
