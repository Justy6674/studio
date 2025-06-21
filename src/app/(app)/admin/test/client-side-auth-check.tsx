"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ClientSideAuthCheckProps {
  fallback: ReactNode;
  render: (isAdmin: boolean) => ReactNode;
}

export function ClientSideAuthCheck({ fallback, render }: ClientSideAuthCheckProps) {
  const { user } = useAuth();
  
  // Simple admin check - you can make this more sophisticated
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('jb-downscale');

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{render(isAdmin)}</>;
}
