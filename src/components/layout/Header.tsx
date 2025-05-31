"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserNav } from "./UserNav";
import { useAuth } from "@/hooks/useAuth";
import { Menu, Droplets } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 relative rounded-lg overflow-hidden border-2 border-hydration-400 shadow-lg bg-hydration-500/10">
            <Image
              src="/Logo (1).png"
              alt="Water4WeightLoss Logo"
              fill
              className="object-cover"
              priority
              sizes="40px"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-hydration-400">Water4WeightLoss</span>
            <span className="text-xs text-brown-300">By Downscale</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {user && navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary text-foreground/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <UserNav />
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background p-6">
                <div className="mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 relative rounded-lg overflow-hidden border-2 border-hydration-400 shadow-lg bg-hydration-500/10">
                    <Image
                      src="/Logo (1).png"
                      alt="Water4WeightLoss Logo"
                      fill
                      className="object-cover"
                      priority
                      sizes="32px"
                    />
                  </div>
                  <span className="font-bold text-hydration-400">Water4WeightLoss</span>
                </div>
                <nav className="flex flex-col space-y-4">
                  {user && navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg transition-colors hover:text-primary text-foreground/80"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
