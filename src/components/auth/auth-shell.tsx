import Link from "next/link";
import type { ReactNode } from "react";

import { LecoMark } from "@/components/ui/leco-mark";
import { ShieldIcon } from "@/components/ui/icons";

type AuthShellProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
  asideTitle: string;
  asideText: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  asideTitle,
  asideText,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-shell__intro" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/" aria-label="Leco, accueil">
          <LecoMark className="auth-brand__mark" />
          <span>Leco</span>
        </Link>

        <div className="auth-shell__copy">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <p className="auth-shell__lede">{description}</p>
        </div>

        <div className="auth-assurance">
          <ShieldIcon aria-hidden="true" />
          <div>
            <strong>{asideTitle}</strong>
            <p>{asideText}</p>
          </div>
        </div>
      </section>

      <section className="auth-shell__form">{children}</section>
    </main>
  );
}
