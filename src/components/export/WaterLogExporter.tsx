"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export function WaterLogExporter() {
  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Download className="h-5 w-5" />
          Export Water Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <p className="text-slate-400">
          Water log export temporarily disabled during Firebase Functions migration.
          <br />
          Focus on core hydration logging functionality.
        </p>
      </CardContent>
    </Card>
  );
} 