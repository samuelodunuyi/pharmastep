"use client";

import { createContext, startTransition, useActionState, useContext } from "react";
import { FormMessage } from "@/components/ui/form-message";
import type { FormAction, FormState } from "@/lib/form-state";

const PendingContext = createContext<boolean | null>(null);

/** True while the enclosing ActionForm's action is running (null outside an ActionForm). */
export function useActionFormPending() {
  return useContext(PendingContext);
}

type ActionFormProps = Omit<React.ComponentProps<"form">, "action" | "onSubmit" | "children"> & {
  action: FormAction;
  /** Children can read the action's state, e.g. for per-field errors. */
  children: React.ReactNode | ((state: FormState) => React.ReactNode);
  /** Where to show the error/success message. "none" when the children render it themselves. */
  message?: "top" | "bottom" | "none";
};

/**
 * Form bound to a server action. Submits inside a transition (rather than via the `action` prop)
 * so React doesn't clear what the user typed when the server returns validation errors.
 */
export function ActionForm({ action, children, message = "bottom", ...formProps }: ActionFormProps) {
  const [state, dispatch, pending] = useActionState(action, {});

  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        const data = new FormData(e.currentTarget, submitter);
        startTransition(() => dispatch(data));
      }}
    >
      <PendingContext.Provider value={pending}>
        {message === "top" && <FormMessage state={state} className="mb-4" />}
        {typeof children === "function" ? children(state) : children}
        {message === "bottom" && <FormMessage state={state} className="mt-4" />}
      </PendingContext.Provider>
    </form>
  );
}
