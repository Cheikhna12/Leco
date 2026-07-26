import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DiscoveryPreview } from "@/components/discovery/discovery-preview";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Button } from "@/components/ui/button";
import { LoadingState, StatePanel } from "@/components/ui/states";

describe("UI foundations", () => {
  it("exposes native button semantics and variants", () => {
    const markup = renderToStaticMarkup(
      <Button variant="secondary">Continuer</Button>,
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain("button--secondary");
    expect(markup).toContain("Continuer");
  });

  it("announces loading and error states", () => {
    const loading = renderToStaticMarkup(<LoadingState />);
    const error = renderToStaticMarkup(
      <StatePanel
        description="Réessaie dans un instant."
        kind="error"
        title="Connexion interrompue"
      />,
    );

    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('role="status"');
    expect(error).toContain('role="alert"');
  });

  it("labels demo data and exposes approximate distances only", () => {
    const markup = renderToStaticMarkup(<DiscoveryPreview />);

    expect(markup).toContain("Aperçu UI");
    expect(markup).toContain("Distance approximative uniquement");
    expect(markup).toContain("Tout près");
    expect(markup).not.toMatch(/\b(?:latitude|longitude)\b/i);
    expect(markup).not.toMatch(/-?\d{1,3}\.\d{3,}/);
  });

  it("uses the Leco brand in accessible navigation", () => {
    const markup = renderToStaticMarkup(<AppNavigation />);

    expect(markup).toContain("Accueil Leco");
    expect(markup).toContain(">Leco<");
  });
});
