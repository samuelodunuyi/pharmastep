"use client";

import { ActionForm } from "@/components/ui/action-form";
import { FieldGroup } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { TextareaField, TextField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { contactAction, updateProfileAction } from "@/app/actions/account";
import { trackOrderAction } from "@/app/actions/track";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  return (
    <ActionForm action={updateProfileAction}>
      {(state) => (
        <FieldGroup>
          <TextField name="fullName" label="Full name" defaultValue={fullName} required error={state.fieldErrors?.fullName} />
          <TextField name="phone" label="Phone" type="tel" defaultValue={phone} error={state.fieldErrors?.phone} />
          <SubmitButton size="lg" className="w-fit">Save changes</SubmitButton>
        </FieldGroup>
      )}
    </ActionForm>
  );
}

export function ContactForm() {
  return (
    <ActionForm action={contactAction} message="none">
      {(state) => {
        if (state.message) return <FormMessage state={state} />;
        const fe = state.fieldErrors ?? {};
        return (
          <FieldGroup>
            {/* Honeypot: hidden from people, filled in by bots. */}
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="name" label="Name" required autoComplete="name" error={fe.name} />
              <TextField name="email" label="Email" type="email" required autoComplete="email" error={fe.email} />
            </div>
            <TextField name="subject" label="Subject" required error={fe.subject} />
            <TextareaField name="message" label="Message" rows={6} required error={fe.message} />
            <SubmitButton size="xl" className="w-fit">Send message</SubmitButton>
          </FieldGroup>
        );
      }}
    </ActionForm>
  );
}

export function TrackOrderForm() {
  return (
    <ActionForm action={trackOrderAction}>
      <FieldGroup>
        <TextField name="reference" label="Order number" required placeholder="PS-XXXXXXXX" className="uppercase" />
        <TextField name="email" label="Email used at checkout" type="email" required autoComplete="email" />
        <SubmitButton size="xl" className="w-full" pendingText="Looking up…">Track order</SubmitButton>
      </FieldGroup>
    </ActionForm>
  );
}
