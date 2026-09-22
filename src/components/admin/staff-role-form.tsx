"use client";

import { ActionForm } from "@/components/ui/action-form";
import { FormField, TextField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { setRoleAction } from "@/app/actions/admin";

const ROLES = [
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "ADMIN", label: "Admin" },
  { value: "CUSTOMER", label: "Customer (remove access)" },
];

export function StaffRoleForm() {
  return (
    <ActionForm action={setRoleAction} className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
      <TextField name="email" label="Email" type="email" required />
      <FormField label="Role" htmlFor="role">
        <Select name="role" defaultValue="PHARMACIST">
          <SelectTrigger id="role" className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>
      <SubmitButton size="lg" className="h-10">Update</SubmitButton>
    </ActionForm>
  );
}
