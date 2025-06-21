"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AdminHeader() {
  const router = useRouter();
  
  return (
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
  );
}
