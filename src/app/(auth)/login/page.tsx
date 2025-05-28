"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Smartphone, Chrome } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#334155' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/logo-128.png"
              alt="Water4WeightLoss"
              width={80}
              height={80}
              className="rounded-lg"
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold" style={{ color: '#F7F2D3' }}>
              Welcome Back
            </h1>
            <p className="text-lg" style={{ color: '#B68A71' }}>
              Continue your hydration journey
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl" style={{ backgroundColor: '#3B475B' }}>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center" style={{ color: '#F7F2D3' }}>
              Sign In
            </CardTitle>
            <CardDescription className="text-center" style={{ color: '#B68A71' }}>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#F7F2D3' }}>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: '#B68A71' }} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#F7F2D3' }}>
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: '#B68A71' }} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Stay Logged In */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stay-logged-in"
                  checked={stayLoggedIn}
                  onCheckedChange={setStayLoggedIn}
                  className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label
                  htmlFor="stay-logged-in"
                  className="text-sm font-medium cursor-pointer"
                  style={{ color: '#F7F2D3' }}
                >
                  Stay logged in for 30 days
                </Label>
              </div>

              {/* Biometric Support Indicator */}
              <div className="flex items-center space-x-2 text-sm" style={{ color: '#B68A71' }}>
                <Smartphone className="h-4 w-4" />
                <span>Biometric login available on supported devices</span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-lg transition-colors"
                style={{ backgroundColor: '#5271FF' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-700 px-2" style={{ color: '#B68A71' }}>
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>

            {/* Footer Links */}
            <div className="text-center space-y-2">
              <Link
                href="/signup"
                className="text-sm hover:underline transition-colors"
                style={{ color: '#5271FF' }}
              >
                Don't have an account? Sign up
              </Link>

              <div className="text-xs" style={{ color: '#B68A71' }}>
                <Link href="/subscription" className="hover:underline">
                  Subscribe for $4.99 AUD/month
                </Link>
                {' • '}
                <Link href="/terms" className="hover:underline">
                  Terms
                </Link>
                {' • '}
                <Link href="/privacy" className="hover:underline">
                  Privacy
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}