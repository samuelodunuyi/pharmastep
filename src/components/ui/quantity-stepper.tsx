"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  pending?: boolean;
  size?: "sm" | "lg";
  className?: string;
};

export function QuantityStepper({ value, onChange, min = 1, max, disabled, pending, size = "sm", className }: QuantityStepperProps) {
  const buttonSize = size === "lg" ? "icon-lg" : "icon-sm";
  return (
    <div
      className={cn("inline-flex items-center rounded-lg border border-input", size === "lg" ? "h-11" : "h-8", className)}
      role="group"
      aria-label="Quantity"
    >
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        onClick={() => onChange(value - 1)}
        disabled={disabled || pending || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span className={cn("grid place-items-center text-sm font-semibold tabular-nums", size === "lg" ? "w-10" : "w-8")} aria-live="polite">
        {pending ? <Spinner className="size-3.5" /> : value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        onClick={() => onChange(value + 1)}
        disabled={disabled || pending || value >= max}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  );
}
