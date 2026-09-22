import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/form-state";

/** Shows a server action's error or success message (and any one-time value). Renders nothing otherwise. */
export function FormMessage({ state, className }: { state: Pick<FormState, "error" | "message" | "reveal">; className?: string }) {
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
        <AlertDescription>
          <p>{state.message}</p>
          {state.reveal && (
            <p className="mt-2">
              <span className="text-foreground">{state.reveal.label}: </span>
              <code className="rounded bg-background px-2 py-1 font-mono text-base font-semibold text-foreground select-all">
                {state.reveal.value}
              </code>
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}
