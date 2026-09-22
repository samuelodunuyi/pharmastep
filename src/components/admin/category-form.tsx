"use client";

import { ActionForm } from "@/components/ui/action-form";
import { FileField, TextField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveCategoryAction } from "@/app/actions/admin";

/** Create (no `category`) or edit a category. Same fields either way. */
export function CategoryForm({ category }: { category?: { id: string; name: string; sortOrder: number } }) {
  const prefix = category ? `cat-${category.id}-` : "new-";
  return (
    <ActionForm action={saveCategoryAction} className="grid gap-3 sm:grid-cols-[1fr_90px_1fr_auto] sm:items-end">
      {category && <input type="hidden" name="id" value={category.id} />}
      <TextField name="name" id={`${prefix}name`} label="Name" defaultValue={category?.name} required />
      <TextField name="sortOrder" id={`${prefix}sort`} label="Order" type="number" defaultValue={category?.sortOrder ?? 0} />
      <FileField name="image" id={`${prefix}image`} label={category ? "Replace image" : "Image"} accept="image/jpeg,image/png,image/webp" />
      <SubmitButton size="lg" className="h-10" variant={category ? "outline" : "default"}>{category ? "Save" : "Add"}</SubmitButton>
    </ActionForm>
  );
}
