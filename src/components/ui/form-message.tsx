import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/form-state";

/** Shows a server action's error or success message. Renders nothing when there's neither. */
export function FormMessage({ state, className }: { state: Pick<FormState, "error" | "message">; className?: string }) {
  if (state.error) {
    return (
      <Alert variant="destructive" className={className}>
        <CircleAlert />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }
  if (state.message) {
    return (
      <Alert variant="success" role="status" className={className}>
        <CircleCheck />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  return null;
}
