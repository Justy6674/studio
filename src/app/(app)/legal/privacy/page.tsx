"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>This is a placeholder for the Privacy Policy. The full text will be added here.</p>
            <p>Last updated: [Date]</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
