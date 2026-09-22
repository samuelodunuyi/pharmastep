"use client";

import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = Omit<React.ComponentProps<typeof Button>, "type" | "onClick" | "name" | "value"> & {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Submitted with the form, like a normal submit button's name/value. */
  name?: string;
  value?: string;
};

/** A submit button that asks for confirmation first, then submits its enclosing form. */
export function ConfirmSubmitButton({ title, description, confirmLabel, name, value, children, ...buttonProps }: ConfirmSubmitButtonProps) {
  // Hidden real submit button, so the form data includes this button's name/value.
  const submitRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={submitRef} type="submit" name={name} value={value} hidden aria-hidden tabIndex={-1} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" {...buttonProps}>
            {children}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              variant={buttonProps.variant === "destructive" ? "destructive" : "default"}
              onClick={() => submitRef.current?.form?.requestSubmit(submitRef.current)}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
