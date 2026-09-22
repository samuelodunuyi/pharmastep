"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  forgotPasswordAction,
  resetPasswordAction,
  signInAction,
  signInWithGoogleAction,
  signUpAction,
} from "@/app/actions/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

function GoogleSignIn({ next }: { next: string }) {
  return (
    <>
      <form action={signInWithGoogleAction}>
        <input type="hidden" name="next" value={next} />
        <SubmitButton variant="outline" size="xl" className="w-full" icon={<GoogleIcon />}>
          Continue with Google
        </SubmitButton>
      </form>
      <FieldSeparator className="my-5">or</FieldSeparator>
    </>
  );
}

export function SignInForm({ next }: { next: string }) {
  return (
    <>
      <GoogleSignIn next={next} />
      <ActionForm action={signInAction}>
        <input type="hidden" name="next" value={next} />
        <FieldGroup>
          <TextField name="email" label="Email" type="email" required autoComplete="email" />
          <TextField
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            description={<Link href="/forgot-password">Forgot password?</Link>}
          />
          <SubmitButton size="xl" className="w-full">Sign in</SubmitButton>
        </FieldGroup>
      </ActionForm>
    </>
  );
}

export function SignUpForm({ next }: { next: string }) {
  return (
    <>
      <GoogleSignIn next={next} />
      <ActionForm action={signUpAction} message="none">
        {(state) => {
          // Once the confirmation email is sent, show only that message.
          if (state.message) return <FormMessage state={state} />;
          const fe = state.fieldErrors ?? {};
          return (
            <FieldGroup>
              <input type="hidden" name="next" value={next} />
              <TextField name="fullName" label="Full name" required autoComplete="name" error={fe.fullName} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="email" label="Email" type="email" required autoComplete="email" error={fe.email} />
                <TextField name="phone" label="Phone" type="tel" required autoComplete="tel" placeholder="08012345678" error={fe.phone} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="password" label="Password" type="password" required minLength={8} autoComplete="new-password" error={fe.password} />
                <TextField name="confirm" label="Confirm password" type="password" required minLength={8} autoComplete="new-password" error={fe.confirm} />
              </div>
              <FormMessage state={{ error: state.error }} />
              <SubmitButton size="xl" className="w-full">Create account</SubmitButton>
            </FieldGroup>
          );
        }}
      </ActionForm>
    </>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={forgotPasswordAction}>
      <FieldGroup>
        <TextField name="email" label="Email" type="email" required autoComplete="email" />
        <SubmitButton size="xl" className="w-full">Send reset link</SubmitButton>
      </FieldGroup>
    </ActionForm>
  );
}

export function ResetPasswordForm() {
  return (
    <ActionForm action={resetPasswordAction}>
      <FieldGroup>
        <TextField name="password" label="New password" type="password" required minLength={8} autoComplete="new-password" />
        <TextField name="confirm" label="Confirm new password" type="password" required minLength={8} autoComplete="new-password" />
        <SubmitButton size="xl" className="w-full">Save password</SubmitButton>
      </FieldGroup>
    </ActionForm>
  );
}
