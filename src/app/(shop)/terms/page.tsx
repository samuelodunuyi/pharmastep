import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/layout/legal-document";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

const SECTIONS: LegalSection[] = [
  {
    heading: "Your account",
    body: (
      <p>
        You must be 18 or older to create an account or place an order. Give accurate details, keep your password to yourself, and tell us if
        you think someone else has used your account. You can also order as a guest.
      </p>
    ),
  },
  {
    heading: "Orders and prices",
    body: (
      <ul>
        <li>Prices are in naira. You’ll see the full price, including the delivery fee worked out from your address, before you pay.</li>
        <li>Your order is confirmed once your payment is received.</li>
        <li>If we can’t supply an item, or need to cancel an order for another reason, we’ll tell you and refund you in full.</li>
      </ul>
    ),
  },
  {
    heading: "Prescription medicines",
    body: (
      <ul>
        <li>Prescription medicines need a valid prescription, issued to the patient by a qualified prescriber, uploaded at checkout.</li>
        <li>A pharmacist checks every prescription before we dispatch. If it can’t be approved, we cancel the order and refund you in full.</li>
        <li>Uploading a prescription that isn’t genuine, or that wasn’t issued to the patient, is not allowed and may be reported.</li>
        <li>Our pharmacists may decline to supply any medicine if they believe it isn’t safe or appropriate.</li>
      </ul>
    ),
  },
  {
    heading: "Payment",
    body: <p>Payments are processed by Paystack. We never see or store your card details.</p>,
  },
  {
    heading: "Delivery",
    body: <p>We deliver within Lagos. Delivery times are estimates. If an item arrives damaged, faulty or wrong, <Link href="/contact">contact us</Link> and we’ll put it right.</p>,
  },
  {
    heading: "Health information and the chat",
    body: (
      <>
        <p>
          Information on this site, including product directions taken from official leaflets and replies from our automated chat assistant,
          is general information. It doesn’t replace advice from a doctor or pharmacist who knows your situation. Always read the pack or leaflet
          before using a medicine.
        </p>
        <p>
          The chat assistant only helps with minor ailments and hands everything else to our pharmacists. The chat is not for emergencies: if
          someone is seriously unwell, call 112 or go to the nearest hospital.
        </p>
      </>
    ),
  },
  {
    heading: "Using the site",
    body: <p>Don’t misuse the site: for example, by trying to access other people’s accounts, orders or chats, or by sending abusive or automated messages. We may limit or suspend access if you do.</p>,
  },
  {
    heading: "Our responsibility",
    body: (
      <p>
        We take care to supply genuine medicines and accurate information. Nothing in these terms limits any rights you have under Nigerian
        consumer protection law, or our responsibility where the law doesn’t allow it to be limited.
      </p>
    ),
  },
  {
    heading: "Governing law",
    body: <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>,
  },
  {
    heading: "Changes and contact",
    body: (
      <p>
        If we change these terms, we’ll update this page and the date at the top. Questions? <Link href="/contact">Contact us</Link>. How we
        handle your information is explained in our <Link href="/privacy">privacy policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of use"
      updated="23 September 2026"
      intro={<p>These terms apply when you use the {SITE.legalName} website and buy from us.</p>}
      sections={SECTIONS}
    />
  );
}
