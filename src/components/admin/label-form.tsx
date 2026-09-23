"use client";

import { BadgeCheck } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FieldGroup } from "@/components/ui/field";
import { TextareaField, TextField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteLabelAction, saveLabelAction } from "@/app/actions/labels";

type Label = { directions: string; warnings: string | null; sourceUrl: string | null; notes: string | null };

/** Enter or review a product's pack label. Approving confirms it matches the pack we stock. */
export function LabelForm({ productId, label }: { productId: string; label: Label | null }) {
  return (
    <div className="space-y-4">
      <ActionForm action={saveLabelAction} message="top">
        {(state) => (
          <FieldGroup>
            <input type="hidden" name="productId" value={productId} />
            <TextareaField
              name="directions"
              label="Directions"
              rows={6}
              defaultValue={label?.directions}
              error={state.fieldErrors?.directions}
              description="How to take or use it, including dose, how often, the maximum and age limits, worded as on the pack. The chat assistant may quote this word for word."
              required
            />
            <TextareaField
              name="warnings"
              label="Warnings"
              rows={5}
              defaultValue={label?.warnings ?? ""}
              error={state.fieldErrors?.warnings}
              description="Who shouldn't use it and when to see a doctor."
            />
            <TextField
              name="sourceUrl"
              label="Source (optional)"
              type="url"
              placeholder="https://"
              defaultValue={label?.sourceUrl ?? ""}
              error={state.fieldErrors?.sourceUrl}
              description="Where the text came from, if not the pack itself."
            />
            <TextareaField
              name="notes"
              label="Notes for pharmacists (optional)"
              rows={3}
              defaultValue={label?.notes ?? ""}
              error={state.fieldErrors?.notes}
              description="Not shown to customers."
            />
            <div className="flex flex-wrap gap-2">
              <SubmitButton name="decision" value="approve" size="lg" icon={<BadgeCheck />}>Checked against the pack: approve</SubmitButton>
              <SubmitButton name="decision" value="draft" size="lg" variant="outline">Save as draft</SubmitButton>
            </div>
          </FieldGroup>
        )}
      </ActionForm>
      {label && (
        <ActionForm action={deleteLabelAction} message="toast">
          <input type="hidden" name="productId" value={productId} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="text-destructive"
            title="Remove this label?"
            description="The product page and the chat assistant will stop using it."
            confirmLabel="Remove"
          >
            Remove label
          </ConfirmSubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
