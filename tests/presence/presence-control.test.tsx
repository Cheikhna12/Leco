import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { PresenceControl } from "@/components/presence/presence-control";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePresence } from "@/hooks/use-presence";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-geolocation");
vi.mock("@/hooks/use-presence");

const requestLocation = vi.fn().mockResolvedValue(true);

function setupHooks() {
  vi.mocked(useGeolocation).mockReturnValue({
    errorMessage: null,
    requestLocation,
    reset: vi.fn(),
    state: "idle",
  });
  vi.mocked(usePresence).mockReturnValue({
    activate: vi.fn(),
    deactivate: vi.fn(),
    error: null,
    loading: false,
    pending: false,
    snapshot: {
      availableUntil: null,
      hasValidLocation: false,
      mood: null,
      status: "OFFLINE",
    },
  });
}

describe("PresenceControl", () => {
  it("réutilise une position encore valide enregistrée pendant l’onboarding", () => {
    setupHooks();
    vi.mocked(usePresence).mockReturnValue({
      activate: vi.fn(),
      deactivate: vi.fn(),
      error: null,
      loading: false,
      pending: false,
      snapshot: {
        availableUntil: null,
        hasValidLocation: true,
        mood: null,
        status: "OFFLINE",
      },
    });

    render(<PresenceControl />);

    expect(
      screen.getByRole("group", { name: /ton mood/i }),
    ).toBeInTheDocument();
    expect(requestLocation).not.toHaveBeenCalled();
  });

  it("explique la confidentialité avant de demander la permission", () => {
    setupHooks();
    render(<PresenceControl />);

    expect(requestLocation).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Je veux être visible" }),
    );

    expect(
      screen.getByText(/Ta position nous aide à te montrer/i),
    ).toBeVisible();
    expect(
      screen.getByText(/Ta position exacte n’est jamais montrée/i),
    ).toBeVisible();
    expect(requestLocation).not.toHaveBeenCalled();
  });

  it("appelle le navigateur seulement après le second consentement", () => {
    setupHooks();
    render(<PresenceControl />);

    fireEvent.click(
      screen.getByRole("button", { name: "Je veux être visible" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Autoriser pour continuer" }),
    );

    expect(requestLocation).toHaveBeenCalledOnce();
  });
});
