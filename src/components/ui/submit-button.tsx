"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useActionFormPending } from "@/components/ui/action-form";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: React.ReactNode;
  icon?: React.ReactNode;
};

/** Submit button that disables itself and shows a spinner while its form's action runs. */
export function SubmitButton({ pendingText, icon, children, disabled, ...props }: SubmitButtonProps) {
  const actionFormPending = useActionFormPending();
  const status = useFormStatus();
  const pending = actionFormPending ?? status.pending;
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? <Spinner /> : icon}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
