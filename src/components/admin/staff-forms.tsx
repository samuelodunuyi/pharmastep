"use client";

import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormField, TextField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { addStaffAction, changeStaffRoleAction, removeStaffAction, resetStaffPasswordAction } from "@/app/actions/admin";

const ROLES = [
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "ADMIN", label: "Admin" },
];

function RoleSelect({ id, defaultValue }: { id: string; defaultValue: string }) {
  return (
    <Select name="role" defaultValue={defaultValue}>
      <SelectTrigger id={id} className="h-10 w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function AddStaffForm() {
  return (
    <ActionForm action={addStaffAction}>
      {(state) => (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_170px_auto] sm:items-start">
          <TextField name="fullName" label="Full name" required error={state.fieldErrors?.fullName} />
          <TextField name="email" label="Work email" type="email" required error={state.fieldErrors?.email} />
          <FormField label="Role" htmlFor="new-role">
            <RoleSelect id="new-role" defaultValue="PHARMACIST" />
          </FormField>
          <SubmitButton size="lg" className="h-10 sm:mt-[1.625rem]">Add</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

/** Role, password reset and removal for one staff member (not shown for your own account). */
export function StaffMemberActions({ id, email, role }: { id: string; email: string; role: string }) {
  return (
    <div className="space-y-3">
      <ActionForm action={changeStaffRoleAction} className="flex items-end gap-2">
        <input type="hidden" name="id" value={id} />
        <FormField label="Role" htmlFor={`role-${id}`} className="w-44">
          <RoleSelect id={`role-${id}`} defaultValue={role} />
        </FormField>
        <SubmitButton variant="outline" size="lg" className="h-10">Save</SubmitButton>
      </ActionForm>
      <div className="flex flex-wrap gap-2">
        <ActionForm action={resetStaffPasswordAction}>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmitButton
            variant="outline"
            size="sm"
            title="Reset password?"
            description={`${email} will get a new temporary password and must choose their own at next sign-in. Their current password stops working.`}
            confirmLabel="Reset password"
          >
            Reset password
          </ConfirmSubmitButton>
        </ActionForm>
        <ActionForm action={removeStaffAction} message="toast">
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmitButton
            variant="destructive"
            size="sm"
            title="Remove staff access?"
            description={`${email} will be signed out and can no longer sign in. Past order updates they made are kept.`}
            confirmLabel="Remove access"
          >
            Remove access
          </ConfirmSubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
