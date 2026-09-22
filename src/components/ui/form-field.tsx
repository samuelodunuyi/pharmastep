"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: React.ReactNode;
  htmlFor: string;
  error?: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** Label + control + help text + error. Every form field in the app goes through this. */
export function FormField({ label, htmlFor, error, description, className, children }: FormFieldProps) {
  return (
    <Field data-invalid={!!error || undefined} className={className}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/** Props shared by the field shortcuts below. `id` defaults to `name`; pass one when a page has several forms with the same field. */
type FieldShortcutProps = {
  name: string;
  id?: string;
  label: React.ReactNode;
  error?: string;
  description?: React.ReactNode;
  fieldClassName?: string;
};

export function TextField({
  name,
  id = name,
  label,
  error,
  description,
  fieldClassName,
  className,
  ...props
}: FieldShortcutProps & Omit<React.ComponentProps<typeof Input>, "id" | "name">) {
  return (
    <FormField label={label} htmlFor={id} error={error} description={description} className={fieldClassName}>
      <Input id={id} name={name} aria-invalid={!!error || undefined} className={cn("h-10", className)} {...props} />
    </FormField>
  );
}

export function FileField({
  name,
  id = name,
  label,
  error,
  description,
  fieldClassName,
  className,
  ...props
}: FieldShortcutProps & Omit<React.ComponentProps<typeof Input>, "id" | "name" | "type">) {
  return (
    <FormField label={label} htmlFor={id} error={error} description={description} className={fieldClassName}>
      <Input id={id} name={name} type="file" aria-invalid={!!error || undefined} className={cn("h-10 pt-2", className)} {...props} />
    </FormField>
  );
}

export function TextareaField({
  name,
  id = name,
  label,
  error,
  description,
  fieldClassName,
  ...props
}: FieldShortcutProps & Omit<React.ComponentProps<typeof Textarea>, "id" | "name">) {
  return (
    <FormField label={label} htmlFor={id} error={error} description={description} className={fieldClassName}>
      <Textarea id={id} name={name} aria-invalid={!!error || undefined} {...props} />
    </FormField>
  );
}

/** Checkbox with the label on the right. Submits "on" when checked, like a native checkbox. */
export function CheckboxField({
  name,
  id = name,
  label,
  description,
  error,
  defaultChecked,
  fieldClassName,
}: FieldShortcutProps & { defaultChecked?: boolean }) {
  return (
    <Field orientation="horizontal" data-invalid={!!error || undefined} className={fieldClassName}>
      <Checkbox id={id} name={name} defaultChecked={defaultChecked} aria-invalid={!!error || undefined} />
      <FieldContent>
        <FieldLabel htmlFor={id} className="font-normal">{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}
