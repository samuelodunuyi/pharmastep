"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { addToCartAction } from "@/app/actions/cart";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  disabled,
  size = "default",
  className,
}: {
  productId: string;
  productName: string;
  quantity?: number;
  disabled?: boolean;
  size?: "default" | "xl";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const res = await addToCartAction(productId, quantity);
      if (res.ok) {
        toast.success(`${productName} added to cart`, {
          action: <Button asChild size="sm"><Link href="/cart">View cart</Link></Button>,
        });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button type="button" onClick={add} disabled={disabled || pending} size={size} className={cn("w-full", className)}>
      {pending ? <Spinner /> : <ShoppingBag />}
      {disabled ? "Out of stock" : "Add to cart"}
    </Button>
  );
}
