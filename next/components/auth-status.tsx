"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    // Determine redirect URL based on current page
    let loginUrl = `/${locale}/auth/login`;

    if (pathname === `/${locale}/auth/login`) {
      // Already on login page - no redirect param
      loginUrl = `/${locale}/auth/login`;
    } else if (pathname === `/${locale}` || pathname === '/') {
      // On home page - redirect to my-agents after login
      loginUrl = `/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/my-agents`)}`;
    } else {
      // On any other page - redirect back to current page
      loginUrl = `/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`;
    }

    return (
      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href={loginUrl}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-16 w-16 rounded-full">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/my-agents`}>My Agents</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/billing`}>Billing</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem asChild>
          <Link href={`/${locale}/templates`}>Templates</Link>
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

