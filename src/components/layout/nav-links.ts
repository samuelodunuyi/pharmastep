import { SITE } from "@/lib/site";
import { CHATS_PAGE } from "@/lib/chat/types";

/** Storefront navigation, shared by the desktop header, mobile menu and footer. */
export const SHOP_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/categories", label: "Categories" },
  { href: "/products?rx=1", label: "Prescription medicines" },
] as const;

/** The chat with a pharmacist is a button (OpenChatButton) placed alongside these. */
export const HELP_LINKS = [
  { href: "/track", label: "Track an order" },
  { href: CHATS_PAGE, label: "Your chats" },
  { href: "/contact", label: "Contact us" },
] as const;

export const APP_LINKS = [
  { href: SITE.links.playStore, label: "Google Play" },
  { href: SITE.links.instagram, label: "Instagram" },
] as const;
