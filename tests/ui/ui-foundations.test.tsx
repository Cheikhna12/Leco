import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { LecoMark } from "@/components/ui/leco-mark";
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

  it("renders the custom Leco mark without generic iconography", () => {
    const markup = renderToStaticMarkup(<LecoMark />);

    expect(markup).toContain('viewBox="0 0 64 64"');
    expect(markup).toContain("leco-mark__route");
    expect(markup).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
