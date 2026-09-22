"use client";

import { ActionForm } from "@/components/ui/action-form";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { changeStaffPasswordAction, staffSignInAction } from "@/app/actions/staff-auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

export function StaffSignInForm() {
  return (
    <ActionForm action={staffSignInAction}>
      <FieldGroup>
        <TextField name="email" label="Work email" type="email" required autoComplete="username" />
        <TextField name="password" label="Password" type="password" required autoComplete="current-password" />
        <SubmitButton size="xl" className="w-full">Sign in</SubmitButton>
      </FieldGroup>
    </ActionForm>
  );
}

export function StaffChangePasswordForm() {
  return (
    <ActionForm action={changeStaffPasswordAction}>
      {(state) => (
        <FieldGroup>
          <TextField
            name="password"
            label="New password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            description={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            error={state.fieldErrors?.password}
          />
          <TextField name="confirm" label="Confirm new password" type="password" required autoComplete="new-password" error={state.fieldErrors?.confirm} />
          <SubmitButton size="xl" className="w-full">Save password</SubmitButton>
        </FieldGroup>
      )}
    </ActionForm>
  );
}
