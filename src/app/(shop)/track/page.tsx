import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { TrackOrderForm } from "@/components/forms/customer-forms";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <AuthCard title="Track your order" description="Use the order number from your confirmation, e.g. PS-7K3M9Q2A.">
      <TrackOrderForm />
    </AuthCard>
  );
}
