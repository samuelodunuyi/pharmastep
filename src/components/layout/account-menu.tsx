"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, MessagesSquare, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions/auth";
import { CHATS_PAGE } from "@/lib/chat/types";

export function AccountMenu({ name, email, isStaff }: { name: string | null; email: string; isStaff: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="lg" aria-label="Account menu">
          <User />
          <span className="hidden sm:inline">{name?.split(" ")[0] ?? "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account"><Package /> My orders</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={CHATS_PAGE}><MessagesSquare /> My chats</Link>
        </DropdownMenuItem>
        {isStaff && (
          <DropdownMenuItem asChild>
            <Link href="/admin"><LayoutDashboard /> Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOutAction()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
