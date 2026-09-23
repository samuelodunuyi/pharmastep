import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/layout/legal-document";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

// Describes what the app actually collects and who it's shared with; keep it in step with the code.
const SECTIONS: LegalSection[] = [
  {
    heading: "What we collect",
    body: (
      <ul>
        <li><strong>Your account:</strong> your name, email address and phone number. Your password is handled by our sign-in provider and stored in a form we can’t read.</li>
        <li><strong>Your orders:</strong> the items you buy, your delivery address, and whether you’ve paid. You enter card details on Paystack’s payment page; we never see or store them.</li>
        <li><strong>Prescriptions:</strong> the photo or PDF you upload for prescription medicines. It’s kept in private storage that only our pharmacy staff can open.</li>
        <li><strong>Chats:</strong> your messages with our assistant and pharmacists. If you aren’t signed in, a cookie on your device links your chats to you; when you sign in, they move to your account.</li>
        <li><strong>Technical information:</strong> cookies that keep you signed in and remember your cart and chats, a note in your browser of which chat replies you’ve seen, and a one-way scrambled version of your IP address that we use only to stop abuse (for example, too many sign-in attempts). We don’t use advertising or tracking cookies.</li>
      </ul>
    ),
  },
  {
    heading: "How we use it",
    body: (
      <ul>
        <li>To take, prepare and deliver your orders, and to email you when your order changes.</li>
        <li>To check prescriptions before we dispatch prescription medicines, as pharmacy rules require.</li>
        <li>To answer your questions in the chat.</li>
        <li>To keep the site and your account secure, and to prevent fraud and misuse.</li>
        <li>To meet our legal and regulatory obligations as a pharmacy.</li>
      </ul>
    ),
  },
  {
    heading: "Our chat assistant",
    body: (
      <>
        <p>
          The “Ask a pharmacist” chat starts with an automated assistant. To write its replies, your messages are sent to our AI provider,
          Anthropic, and the assistant may look things up on a short list of trusted health websites. Its replies are marked as automated and
          aren’t reviewed by a pharmacist. Our pharmacists can read chats and take over at any time, and do so for anything beyond a minor ailment.
        </p>
        <p>The chat is not for emergencies. If someone is seriously unwell, call 112 or go to the nearest hospital.</p>
      </>
    ),
  },
  {
    heading: "Who we share it with",
    body: (
      <>
        <p>We don’t sell your information. We share it only with the services we use to run the pharmacy, and only what each one needs:</p>
        <ul>
          <li><strong>Supabase</strong> stores our database, your sign-in details and uploaded files, on servers in the European Union (Ireland).</li>
          <li><strong>Vercel</strong> hosts the website.</li>
          <li><strong>Paystack</strong> processes your payments.</li>
          <li><strong>Anthropic</strong> writes the chat assistant’s replies from your chat messages.</li>
          <li><strong>Google Maps</strong> works out the delivery distance from your address.</li>
          <li><strong>Resend</strong> sends our order emails.</li>
        </ul>
        <p>Some of these services process information outside Nigeria. We may also share information when the law requires it, for example with pharmacy regulators.</p>
      </>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <p>
        We keep order and prescription records for as long as the law requires pharmacies to keep them. We keep your account and chats while
        your account is open or while we need them to provide the service. You can ask us to delete your information at any time; we’ll delete
        what we aren’t required to keep.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <>
        <p>Under the Nigeria Data Protection Act 2023 you can ask us to:</p>
        <ul>
          <li>give you a copy of the information we hold about you;</li>
          <li>correct information that’s wrong;</li>
          <li>delete your information, or stop or limit how we use it;</li>
          <li>send your information to you or another organisation in a common format.</li>
        </ul>
        <p>
          To do any of these, <Link href="/contact">contact us</Link>. If you’re unhappy with how we’ve handled your information, you can
          complain to the Nigeria Data Protection Commission.
        </p>
      </>
    ),
  },
  {
    heading: "Keeping it safe",
    body: (
      <p>
        The site is only served over encrypted connections. Prescriptions are stored privately and opened only by our staff, through links
        that expire after a few minutes. Staff accounts are separate from customer accounts and can only reach what their role needs.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: <p>If we change this policy, we’ll update this page and the date at the top.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      updated="23 September 2026"
      intro={<p>This policy explains what information {SITE.legalName} collects when you use our website, how we use it, and your rights.</p>}
      sections={SECTIONS}
    />
  );
}
