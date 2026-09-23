"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wordmark } from "@/components/brand/logo";
import { OpenChatButton } from "@/components/chat/chat-provider";
import { HELP_LINKS, SHOP_LINKS } from "@/components/layout/nav-links";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle><Wordmark className="text-lg" /></SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {[...SHOP_LINKS, ...HELP_LINKS].map((link, i) => (
            <div key={link.href}>
              {i === SHOP_LINKS.length && <Separator className="my-2" />}
              <SheetClose asChild>
                <Link href={link.href} className="block rounded-md px-2 py-2.5 text-sm font-medium hover:bg-accent">
                  {link.label}
                </Link>
              </SheetClose>
            </div>
          ))}
          <SheetClose asChild>
            <OpenChatButton variant="ghost" className="h-auto justify-start px-2 py-2.5 font-medium">Chat with a pharmacist</OpenChatButton>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
