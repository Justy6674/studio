
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Fingerprint, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricSupported, setBiometricSupported] = useState(false);
  const router = useRouter();

  // Check for biometric support
  useState(() => {
    if (typeof window !== "undefined" && "PublicKeyCredential" in window) {
      setBiometricSupported(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Set persistence based on user choice
      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricSupported) return;
    
    try {
      // Basic WebAuthn implementation
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required"
        }
      });
      
      if (credential) {
        // Handle biometric authentication success
        console.log("Biometric authentication successful");
      }
    } catch (error) {
      console.error("Biometric authentication failed:", error);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#334155' }}
    >
      <Card 
        className="w-full max-w-md shadow-2xl border-0"
        style={{ backgroundColor: '#3B475B' }}
      >
        <CardHeader className="text-center space-y-6 pb-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/logo-128.png"
                alt="Water4WeightLoss"
                width={80}
                height={80}
                className="rounded-xl"
                priority
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle 
              className="text-2xl font-bold"
              style={{ color: '#F7F2D3' }}
            >
              Welcome Back
            </CardTitle>
            <CardDescription 
              className="text-base"
              style={{ color: '#B68A71' }}
            >
              Sign in to track your hydration journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert 
              className="border-red-500/50"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <AlertCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
              <AlertDescription style={{ color: '#FCA5A5' }}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium"
                style={{ color: '#F7F2D3' }}
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="text-slate-100 placeholder-slate-400 border-slate-600 focus:border-blue-500"
                style={{ backgroundColor: '#475569' }}
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="text-sm font-medium"
                style={{ color: '#F7F2D3' }}
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="text-slate-100 placeholder-slate-400 border-slate-600 focus:border-blue-500 pr-10"
                  style={{ backgroundColor: '#475569' }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: '#B68A71' }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: '#B68A71' }} />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stay-logged-in"
                  checked={stayLoggedIn}
                  onCheckedChange={(checked) => setStayLoggedIn(checked as boolean)}
                  className="border-slate-600"
                />
                <label 
                  htmlFor="stay-logged-in" 
                  className="text-sm"
                  style={{ color: '#B68A71' }}
                >
                  Stay logged in
                </label>
              </div>
              <Link 
                href="/forgot-password" 
                className="text-sm hover:underline"
                style={{ color: '#5271FF' }}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#5271FF' }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {biometricSupported && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-600 hover:bg-slate-700/50"
                style={{ color: '#B68A71' }}
                onClick={handleBiometricLogin}
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Use Face ID / Touch ID
              </Button>
            )}
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Don't have an account?{" "}
              <Link 
                href="/signup" 
                className="font-medium hover:underline"
                style={{ color: '#5271FF' }}
              >
                Sign up
              </Link>
            </p>
            
            <div 
              className="border-t pt-4"
              style={{ borderColor: '#4A5568' }}
            >
              <Link
                href="/subscribe"
                className="inline-flex items-center text-sm font-medium hover:underline"
                style={{ color: '#B68A71' }}
              >
                Subscribe for $4.99/mo - Premium Features
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
