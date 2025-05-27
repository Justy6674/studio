
"use client";

import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-700">
      {children}
    </div>
  );
}
