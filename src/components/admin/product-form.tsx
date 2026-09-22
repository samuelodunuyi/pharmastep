"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { CheckboxField, FileField, FormField, TextareaField, TextField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { ProductImage } from "@/components/product/product-image";
import { saveProductAction } from "@/app/actions/admin";

export type ProductFormValues = {
  id?: string;
  name: string;
  manufacturer: string;
  description: string;
  activeIngredient: string;
  strength: string;
  packSize: string;
  dosageForm: string;
  nafdacNumber: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
  tags: string;
  expiryDate: string;
  requiresPrescription: boolean;
  isActive: boolean;
  images: string[];
};

const NO_CATEGORY = "none";
const DOSAGE_FORMS = ["Tablet", "Caplet", "Capsule", "Syrup", "Suspension", "Sachet", "Cream", "Ointment", "Gel", "Drops", "Injection", "Inhaler", "Pessary", "Pack", "Device"];

export function ProductForm({ values, categories }: { values: ProductFormValues; categories: { id: string; name: string }[] }) {
  const [images, setImages] = useState(values.images);

  return (
    <ActionForm action={saveProductAction} message="none" className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {(state) => (
        <>
          {values.id && <input type="hidden" name="id" value={values.id} />}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <TextField name="name" label="Product name" defaultValue={values.name} required fieldClassName="sm:col-span-2" />
                  <TextField name="manufacturer" label="Manufacturer / brand" defaultValue={values.manufacturer} />
                  <TextField name="activeIngredient" label="Active ingredient" defaultValue={values.activeIngredient} placeholder="e.g. Artemether/Lumefantrine" />
                  <TextField name="strength" label="Strength" defaultValue={values.strength} placeholder="e.g. 80/480 mg" />
                  <TextField name="packSize" label="Pack size" defaultValue={values.packSize} placeholder="e.g. 6 tablets" />
                  <TextField name="dosageForm" label="Form" defaultValue={values.dosageForm} list="dosage-forms" />
                  <datalist id="dosage-forms">{DOSAGE_FORMS.map((f) => <option key={f} value={f} />)}</datalist>
                  <TextField name="nafdacNumber" label="NAFDAC reg. no." defaultValue={values.nafdacNumber} />
                  <TextareaField name="description" label="Description" rows={6} defaultValue={values.description} fieldClassName="sm:col-span-2" />
                  <TextField name="tags" label="Search tags" description="Comma separated, e.g. malaria, fever" defaultValue={values.tags} fieldClassName="sm:col-span-2" />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>The first image is the main one.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {images.map((src) => (
                      <div key={src} className="relative size-24 overflow-hidden rounded-lg border bg-background">
                        <input type="hidden" name="keepImage" value={src} />
                        <ProductImage src={src} alt="" sizes="96px" className="p-1" />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-xs"
                          className="absolute top-1 right-1"
                          onClick={() => setImages((imgs) => imgs.filter((i) => i !== src))}
                          aria-label="Remove image"
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <FileField name="newImages" label="Add images" description="JPG, PNG or WebP, up to 5 MB each." multiple accept="image/jpeg,image/png,image/webp" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent>
                <FieldGroup>
                  <TextField name="price" label="Price (₦)" type="number" step="0.01" min="0" required defaultValue={values.price} />
                  <TextField name="compareAtPrice" label="Was price (₦, optional)" type="number" step="0.01" min="0" defaultValue={values.compareAtPrice} />
                  <TextField name="stock" label="Stock" type="number" min="0" step="1" required defaultValue={values.stock} />
                  <TextField name="expiryDate" label="Expiry date (nearest batch)" type="date" defaultValue={values.expiryDate} />
                  <FormField label="Category" htmlFor="categoryId">
                    <Select name="categoryId" defaultValue={values.categoryId || NO_CATEGORY}>
                      <SelectTrigger id="categoryId" className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <CheckboxField name="requiresPrescription" label="Prescription only (Rx)" description="Customers must upload a prescription." defaultChecked={values.requiresPrescription} />
                  <CheckboxField name="isActive" label="Visible in store" defaultChecked={values.isActive} />
                </FieldGroup>
              </CardContent>
            </Card>
            <FormMessage state={state} />
            <SubmitButton size="xl" className="w-full">Save product</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
