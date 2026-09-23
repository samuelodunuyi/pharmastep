import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CenteredMessage } from "@/components/ui/centered-message";
import { Wordmark } from "@/components/brand/logo";

type EnvVar = { name: string; purpose: string };

/**
 * Shown instead of the site when required settings are missing.
 * `detailed` (local development only) lists the missing setting names; the public version
 * reveals nothing about the configuration. Values are never shown either way.
 */
export function SetupRequired({ detailed, missing, optionalMissing }: { detailed: boolean; missing: EnvVar[]; optionalMissing: EnvVar[] }) {
  if (!detailed) {
    return (
      <CenteredMessage
        eyebrow={<Wordmark className="text-base" />}
        title="We’ll be right back"
        description="Our online store is temporarily unavailable. Please try again shortly."
      />
    );
  }

  return (
    <CenteredMessage
      eyebrow={<Wordmark className="text-base" />}
      title="This site isn’t configured yet"
      description="Some required settings are missing. This checklist only appears in local development; visitors to a deployed site see a generic “temporarily unavailable” page."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="size-4" /> Missing settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <EnvList vars={missing} />
          {optionalMissing.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Optional, also missing</p>
              <EnvList vars={optionalMissing} muted />
            </div>
          )}
          <p className="rounded-lg bg-muted p-3 text-muted-foreground">
            Copy <code>.env.example</code> to <code>.env</code>, fill it in, and restart <code>npm run dev</code>. The README explains where
            to find each value.
          </p>
        </CardContent>
      </Card>
    </CenteredMessage>
  );
}

function EnvList({ vars, muted }: { vars: EnvVar[]; muted?: boolean }) {
  return (
    <ul className="space-y-2">
      {vars.map((v) => (
        <li key={v.name}>
          <code className={muted ? "text-muted-foreground" : "font-semibold text-destructive"}>{v.name}</code>
          <p className="text-muted-foreground">{v.purpose}</p>
        </li>
      ))}
    </ul>
  );
}
