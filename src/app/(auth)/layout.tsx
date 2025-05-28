
"use client";

import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#334155' }}>
      {children}
    </div>
  );
}
