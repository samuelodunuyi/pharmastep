import type { Metadata } from "next";

// Shared by the staff sign-in pages and the guarded admin panel.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | PharmaStep Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
