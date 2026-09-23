"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { CheckboxField, FileField, TextareaField, TextField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrderTotals } from "@/components/order/order-summary";
import { placeOrderAction, quoteDeliveryAction } from "@/app/actions/checkout";
import { AgreeToTerms } from "@/components/layout/legal-document";
import type { DeliveryQuote } from "@/lib/delivery";

type Defaults = { email: string; fullName: string; phone: string };

export function CheckoutForm({
  defaults,
  subtotalKobo,
  needsPrescription,
  signedIn,
}: {
  defaults: Defaults;
  subtotalKobo: number;
  needsPrescription: boolean;
  signedIn: boolean;
}) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoting, startQuote] = useTransition();

  function refreshQuote() {
    if (address.trim().length < 8 || city.trim().length < 2) return;
    startQuote(async () => setQuote(await quoteDeliveryAction(address, city)));
  }

  return (
    <ActionForm action={placeOrderAction} message="none" className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {(state) => {
        const fe = state.fieldErrors ?? {};
        return (
          <>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                  {!signedIn && (
                    <CardDescription>
                      Checking out as a guest. <Link href="/login?next=/checkout" className="font-semibold text-primary hover:underline">Sign in</Link> to
                      save your order history.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <FieldGroup className="grid gap-4 sm:grid-cols-2">
                    <TextField name="email" label="Email" type="email" required autoComplete="email" defaultValue={defaults.email} error={fe.email} fieldClassName="sm:col-span-2" />
                    <TextField name="fullName" label="Recipient’s full name" required autoComplete="name" defaultValue={defaults.fullName} error={fe.fullName} />
                    <TextField name="phone" label="Phone number" type="tel" required autoComplete="tel" placeholder="08012345678" defaultValue={defaults.phone} error={fe.phone} />
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery address</CardTitle>
                  <CardDescription>We currently deliver within Lagos State.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      name="addressLine"
                      label="Street address"
                      required
                      autoComplete="street-address"
                      placeholder="House number, street, landmark"
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); setQuote(null); }}
                      onBlur={refreshQuote}
                      error={fe.addressLine}
                      fieldClassName="sm:col-span-2"
                    />
                    <TextField
                      name="city"
                      label="Area / city"
                      required
                      placeholder="e.g. Lekki Phase 1"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setQuote(null); }}
                      onBlur={refreshQuote}
                      error={fe.city}
                    />
                    <TextField name="state" label="State" value="Lagos" readOnly disabled />
                    <TextareaField name="deliveryNotes" label="Delivery notes (optional)" rows={2} maxLength={300} placeholder="Gate code, best time to call…" fieldClassName="sm:col-span-2" />
                  </FieldGroup>
                </CardContent>
              </Card>

              {needsPrescription && (
                <Card className="ring-brand/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-brand" /> Prescription</CardTitle>
                    <CardDescription>
                      Your order contains prescription-only medicine. Upload a clear photo or PDF of a valid prescription showing the
                      patient’s name, the medicine, the prescriber’s details and the date.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <FileField
                        name="prescription"
                        label="Prescription file"
                        description="JPG, PNG, WebP or PDF, up to 6 MB."
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        capture="environment"
                        required
                        error={fe.prescription}
                      />
                      <CheckboxField
                        name="consent"
                        error={fe.consent}
                        label="I confirm this prescription is genuine and was issued for the person receiving this medicine. I understand the order is dispatched only after pharmacist approval, and refunded in full if it can’t be approved."
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="h-fit lg:sticky lg:top-28">
              <CardHeader>
                <CardTitle>Payment summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <OrderTotals
                  subtotalKobo={subtotalKobo}
                  delivery={quoting ? <Spinner /> : quote ? quote.feeKobo : <span className="text-muted-foreground">Enter address</span>}
                  deliveryNote={quote?.distanceKm != null && <span className="text-xs">({quote.distanceKm} km)</span>}
                />
                <FormMessage state={state} />
                <SubmitButton variant="brand" size="xl" className="w-full" icon={<Lock />} pendingText="Redirecting to Paystack…">
                  Pay securely with Paystack
                </SubmitButton>
                <p className="text-center text-xs text-muted-foreground">
                  Card, bank transfer or USSD. The delivery fee is confirmed from your address when you pay.
                </p>
                <AgreeToTerms action="placing your order" />
              </CardContent>
            </Card>
          </>
        );
      }}
    </ActionForm>
  );
}
