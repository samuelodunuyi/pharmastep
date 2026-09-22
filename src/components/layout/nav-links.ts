import { SITE } from "@/lib/site";

/** Storefront navigation, shared by the desktop header, mobile menu and footer. */
export const SHOP_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/categories", label: "Categories" },
  { href: "/products?rx=1", label: "Prescription medicines" },
] as const;

export const HELP_LINKS = [
  { href: "/track", label: "Track an order" },
  { href: "/contact", label: "Contact us" },
  { href: SITE.links.whatsapp, label: "WhatsApp a pharmacist" },
] as const;

export const APP_LINKS = [
  { href: SITE.links.playStore, label: "Google Play" },
  { href: SITE.links.instagram, label: "Instagram" },
] as const;
