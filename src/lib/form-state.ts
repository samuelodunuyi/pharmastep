/** Return shape shared by every form server action. */
export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** A one-time value to show the user, e.g. a temporary password. Never stored or shown again. */
  reveal?: { label: string; value: string };
};

export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;
