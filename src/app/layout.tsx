import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { Toaster } from "@/components/ui/sonner";
import { SetupRequired } from "@/components/setup-required";
import { missingEnv, OPTIONAL_ENV, REQUIRED_ENV } from "@/lib/env";
import { SITE } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${SITE.name} — Online pharmacy in Lagos`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  // Icons come from src/app/icon.jpg and apple-icon.jpg (Next.js file convention).
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the environment at request time, not build time, so adding variables and redeploying takes effect.
  await connection();
  const missing = missingEnv(REQUIRED_ENV);
  const isDev = process.env.NODE_ENV === "development";
  if (missing.length > 0 && !isDev) {
    // Visitors see a generic page; the details go to the server logs (e.g. Vercel → Logs).
    console.error(`Site unavailable: missing required environment variables: ${missing.map((v) => v.name).join(", ")}`);
  }

  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen">
        {missing.length > 0 ? (
          <SetupRequired detailed={isDev} missing={missing} optionalMissing={missingEnv(OPTIONAL_ENV)} />
        ) : (
          children
        )}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
