import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { LEGAL_LINKS } from "@/components/layout/nav-links";

/** "By creating an account, you agree to our Terms of use and Privacy policy." under a form's submit button. */
export function AgreeToTerms({ action }: { action: string }) {
  const [terms, privacy] = LEGAL_LINKS;
  return (
    <p className="text-center text-xs text-muted-foreground">
      By {action}, you agree to our <Link href={terms.href} className="underline hover:text-primary">{terms.label}</Link> and{" "}
      <Link href={privacy.href} className="underline hover:text-primary">{privacy.label}</Link>.
    </p>
  );
}

export type LegalSection = { heading: string; body: React.ReactNode };

/** A policy page (privacy policy, terms): title, last-updated date and numbered sections. */
export function LegalDocument({ title, updated, intro, sections }: { title: string; updated: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <PageHeader title={title} description={`Last updated ${updated}`} />
      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        <div className="space-y-3">{intro}</div>
        {sections.map((s, i) => (
          <section key={s.heading} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{i + 1}. {s.heading}</h2>
            {s.body}
          </section>
        ))}
      </div>
    </div>
  );
}
