import Link from "next/link";
import { Info } from "lucide-react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price } from "@/components/product/product-badges";
import { ProductImage } from "@/components/product/product-image";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessageView, ChatProduct } from "@/lib/chat/types";

type Viewer = "customer" | "pharmacist";

const SENDER_LABEL: Record<string, string> = { ASSISTANT: "PharmaStep assistant", CUSTOMER: "Customer" };

/**
 * A chat conversation, as the customer sees it in the chat window or a pharmacist sees it in the admin.
 * The viewer's own messages sit on the right.
 */
export function ChatThread({ messages, viewer, className }: { messages: ChatMessageView[]; viewer: Viewer; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {messages.map((m) => (
        <li key={m.id}>
          {m.role === "SYSTEM" ? <SystemNotice message={m} /> : <Bubble message={m} viewer={viewer} />}
        </li>
      ))}
    </ol>
  );
}

function Bubble({ message: m, viewer }: { message: ChatMessageView; viewer: Viewer }) {
  const own = viewer === "customer" ? m.role === "CUSTOMER" : m.role === "PHARMACIST";
  const sender = m.role === "PHARMACIST" ? `${m.authorName ?? "Pharmacist"} · Pharmacist` : SENDER_LABEL[m.role];

  return (
    <div className={cn("flex flex-col gap-1", own ? "items-end" : "items-start")}>
      {!own && <p className="px-1 text-xs font-medium text-muted-foreground">{sender}</p>}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
          own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
        )}
      >
        {m.content}
      </div>
      {m.products.length > 0 && (
        <ul className="w-full max-w-[85%] space-y-2">
          {m.products.map((p) => (
            <li key={p.id}><ProductRow product={p} canBuy={viewer === "customer"} /></li>
          ))}
        </ul>
      )}
      <time dateTime={m.createdAt} className="px-1 text-[11px] text-muted-foreground">{formatTime(m.createdAt)}</time>
    </div>
  );
}

function ProductRow({ product: p, canBuy }: { product: ChatProduct; canBuy: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-2">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        <ProductImage src={p.images[0]} alt={p.name} sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">{p.name}</Link>
        <Price kobo={p.priceKobo} className="text-sm" />
      </div>
      {canBuy && <AddToCartButton productId={p.id} productName={p.name} disabled={p.stock <= 0} className="w-auto shrink-0" />}
    </div>
  );
}

function SystemNotice({ message: m }: { message: ChatMessageView }) {
  return (
    <p className="mx-auto flex max-w-[90%] items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
      <Info className="mt-px size-3.5 shrink-0" />
      <span>{m.content}</span>
    </p>
  );
}
