type DeliveryDetailsProps = {
  customerName: string;
  addressLine: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  deliveryNotes?: string | null;
  /** Staff see tappable phone/email links. */
  contactLinks?: boolean;
};

export function DeliveryDetails({ customerName, addressLine, city, state, phone, email, deliveryNotes, contactLinks }: DeliveryDetailsProps) {
  return (
    <div className="space-y-0.5 text-sm">
      <p className="font-medium">{customerName}</p>
      <p className="text-muted-foreground">{addressLine}</p>
      <p className="text-muted-foreground">{[city, state].filter(Boolean).join(", ")}</p>
      <p className="pt-2">
        {contactLinks ? <a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a> : phone}
      </p>
      {email && (
        <p>{contactLinks ? <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a> : email}</p>
      )}
      {deliveryNotes && <p className="mt-2 rounded-md bg-muted p-2 text-muted-foreground">{deliveryNotes}</p>}
    </div>
  );
}
