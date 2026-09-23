import { ChatProvider } from "@/components/chat/chat-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isAssistantConfigured } from "@/lib/env";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider assistantEnabled={isAssistantConfigured()}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </ChatProvider>
  );
}
