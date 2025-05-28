"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Fingerprint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Set persistence based on user preference
      const persistence = stayLoggedIn ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      // Sign in user
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#334155' }}>
      <Card className="w-full max-w-md shadow-2xl border-0" style={{ backgroundColor: '#3B475B' }}>
        <CardHeader className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(82, 113, 255, 0.1)' }}>
              <Image
                src="/logo-128.png"
                alt="Water4WeightLoss"
                width={64}
                height={64}
                className="rounded-lg"
                priority
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold" style={{ color: '#F7F2D3' }}>
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg mt-2" style={{ color: '#B68A71' }}>
              Sign in to continue your hydration journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-500 bg-red-50/10">
              <AlertDescription className="text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#F7F2D3' }}>
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#B68A71' }} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-2 rounded-xl text-base"
                  style={{ 
                    backgroundColor: 'rgba(71, 85, 105, 0.5)', 
                    borderColor: '#4A5568',
                    color: '#F7F2D3'
                  }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#F7F2D3' }}>
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#B68A71' }} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-2 rounded-xl text-base"
                  style={{ 
                    backgroundColor: 'rgba(71, 85, 105, 0.5)', 
                    borderColor: '#4A5568',
                    color: '#F7F2D3'
                  }}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Stay Logged In */}
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="stay-logged-in" className="font-medium text-sm" style={{ color: '#F7F2D3' }}>
                Stay logged in
              </Label>
              <Switch
                id="stay-logged-in"
                checked={stayLoggedIn}
                onCheckedChange={setStayLoggedIn}
                style={{ 
                  '--tw-ring-color': '#5271FF'
                }}
              />
            </div>

            {/* Biometric Support Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(82, 113, 255, 0.1)' }}>
              <Fingerprint className="h-5 w-5" style={{ color: '#5271FF' }} />
              <span className="text-sm" style={{ color: '#B68A71' }}>
                Biometric login available on supported devices
              </span>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 font-bold text-xl rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                backgroundColor: '#5271FF', 
                color: '#F7F2D3'
              }}
              disabled={isLoading}
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

          {/* Footer Links */}
          <div className="text-center space-y-3 pt-4">
            <p className="text-sm" style={{ color: '#B68A71' }}>
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#5271FF' }}>
                Sign up here
              </Link>
            </p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="underline hover:no-underline">
                Terms of Service
              </Link>
            </p>
            <div className="pt-2">
              <Link 
                href="/subscribe" 
                className="text-xs font-medium hover:underline" 
                style={{ color: '#B68A71' }}
              >
                Upgrade to Premium - $4.99 AUD/month
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}