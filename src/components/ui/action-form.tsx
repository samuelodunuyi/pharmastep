"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
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
  /**
   * Where to show the error/success message. "toast" for forms that disappear on success
   * (e.g. removing a row); "none" when the children render it themselves.
   */
  message?: "top" | "bottom" | "toast" | "none";
  /** Clear the fields after a successful submit (e.g. a chat reply box). */
  resetOnSuccess?: boolean;
};

/**
 * Form bound to a server action. Submits inside a transition (rather than via the `action` prop)
 * so React doesn't clear what the user typed when the server returns validation errors.
 */
export function ActionForm({ action, children, message = "bottom", resetOnSuccess, ...formProps }: ActionFormProps) {
  const [state, dispatch, statePending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const initialState = useRef(state);

  useEffect(() => {
    if (resetOnSuccess && state !== initialState.current && !state.error && !state.fieldErrors) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  const [toastPending, startToastTransition] = useTransition();
  const pending = message === "toast" ? toastPending : statePending;

  function submit(data: FormData) {
    if (message !== "toast") {
      startTransition(() => dispatch(data));
      return;
    }
    // Call the action directly: the form may be gone (e.g. its row removed) by the time the result arrives.
    startToastTransition(async () => {
      const result = await action({}, data);
      if (result.error) toast.error(result.error);
      else if (result.message) toast.success(result.message);
    });
  }

  return (
    <form
      ref={formRef}
      {...formProps}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        submit(new FormData(e.currentTarget, submitter));
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
