import type { Metadata } from "next";
import { ChatHistory } from "@/components/chat/chat-history";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Your chats", robots: { index: false } };

export default async function ChatsPage() {
  const profile = await getCurrentProfile();
  return <ChatHistory signedIn={!!profile} />;
}
