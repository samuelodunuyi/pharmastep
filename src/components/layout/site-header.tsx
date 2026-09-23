import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { OpenChatButton } from "@/components/chat/chat-provider";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchForm } from "@/components/layout/search-form";
import { getCurrentProfile, isStaff } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { SITE } from "@/lib/site";

export async function SiteHeader() {
  const [profile, cartCount] = await Promise.all([getCurrentProfile(), getCartCount()]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="bg-primary text-xs text-primary-foreground/80">
        <div className="container-page flex h-8 items-center justify-between gap-4">
          <p className="truncate">{SITE.tagline}</p>
          <OpenChatButton variant="link" className="h-auto shrink-0 p-0 text-xs font-semibold text-primary-foreground">
            Chat with a pharmacist
          </OpenChatButton>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-2 sm:gap-4">
        <MobileNav />
        <Logo />
        <SearchForm className="hidden flex-1 md:flex" />

        <nav className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="lg" className="hidden lg:inline-flex">
            <Link href="/categories">Categories</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="hidden lg:inline-flex">
            <Link href="/track">Track order</Link>
          </Button>
          {profile ? (
            <AccountMenu name={profile.fullName} email={profile.email} isStaff={isStaff(profile)} />
          ) : (
            <Button asChild variant="ghost" size="lg">
              <Link href="/login"><User /> <span className="hidden sm:inline">Sign in</span></Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="icon-lg" className="relative">
            <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>

      <div className="container-page pb-3 md:hidden">
        <SearchForm placeholder="Search medicines" />
      </div>
    </header>
  );
}
