'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, History, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'History',
    href: '/history',
    icon: History,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                'flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-full',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={item.href} aria-label={item.name}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
