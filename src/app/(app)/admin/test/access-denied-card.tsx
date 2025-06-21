"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export function AccessDeniedCard() {
  const router = useRouter();
  
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
