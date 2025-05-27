"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#334155]">
      {children}
    </div>
  );
}