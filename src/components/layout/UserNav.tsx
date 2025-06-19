"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";

export function UserNav() {
  const { user, userProfile, logOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user]);

  if (!user) return null; 
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-2">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const displayName = userProfile?.name || user.email || "User";
  const initials = getInitials(userProfile?.name || user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full active:scale-95 transition-transform"
          aria-label="User menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={displayName} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {userProfile?.name && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="py-2">
            <Link href="/settings" className="flex items-center w-full">
              <Settings className="mr-3 h-5 w-5" />
              <span className="text-base">Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="py-2">
          <LogOut className="mr-3 h-5 w-5" />
          <span className="text-base">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
