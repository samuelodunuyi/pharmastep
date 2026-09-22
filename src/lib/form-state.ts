/** Return shape shared by every form server action. */
export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;
