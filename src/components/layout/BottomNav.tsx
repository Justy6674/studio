'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, History, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

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

// Function to trigger haptic feedback on mobile devices
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    // Short vibration for tactile feedback
    navigator.vibrate(40);
  }
};

export function BottomNav() {
  const pathname = usePathname();

  useEffect(() => {
    // Add touch feedback for all interactive elements
    const addTouchFeedback = () => {
      document.querySelectorAll('button, a').forEach(element => {
        element.addEventListener('touchstart', triggerHaptic);
      });
    };
    
    // Add touch feedback after a short delay to ensure DOM is ready
    const timerId = setTimeout(addTouchFeedback, 1000);
    
    return () => {
      clearTimeout(timerId);
      document.querySelectorAll('button, a').forEach(element => {
        element.removeEventListener('touchstart', triggerHaptic);
      });
    };
  }, []);

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50" 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex h-16 items-center justify-around px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                'flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-full relative touch-manipulation',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              <Link href={item.href} aria-label={item.name}>
                <motion.div
                  className="flex flex-col items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                  <span className="text-xs">{item.name}</span>
                  {isActive && (
                    <motion.div 
                      className="absolute -bottom-1 h-1 w-6 bg-primary rounded-full" 
                      layoutId="bottomNavIndicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            </Button>
          );
        })}
      </div>
    </motion.nav>
  );
}
