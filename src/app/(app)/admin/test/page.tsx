"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AIMotivationTester } from "@/components/admin/AIMotivationTester";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminTestPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Simple admin check - you can make this more sophisticated
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('jb-downscale');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <Card className="bg-slate-800 border-red-500/30 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              This page is restricted to administrators only.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-amber-400">Admin Testing Dashboard</h1>
            <p className="text-slate-400">AI motivation system testing and debugging tools</p>
          </div>
        </div>

        {/* AI Motivation Tester */}
        <AIMotivationTester />
      </div>
    </div>
  );
} 