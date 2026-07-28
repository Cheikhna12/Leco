import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import type { OnboardingState } from "@/features/profiles/profile-types";

const replace = vi.fn();
const geolocation = vi.hoisted(() => ({
  errorMessage: null as string | null,
  requestLocation: vi.fn().mockResolvedValue(true),
  state: "idle" as
    | "idle"
    | "checking"
    | "requesting"
    | "ready"
    | "denied"
    | "blocked"
    | "unavailable"
    | "timeout"
    | "inaccurate"
    | "unsupported"
    | "error",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
}));
vi.mock("@/hooks/use-geolocation", () => ({
  useGeolocation: () => ({
    errorMessage: geolocation.errorMessage,
    requestLocation: geolocation.requestLocation,
    reset: vi.fn(),
    state: geolocation.state,
  }),
}));

const profile: OnboardingState = {
  firstName: "Awa",
  birthDate: "2000-05-14",
  gender: "woman",
  searchingFor: ["man"],
  bio: "Une bio.",
  adultConfirmed: true,
  onboardingStep: 3,
  isProfileComplete: false,
  photos: [
    {
      id: "10000000-0000-0000-0000-000000000001",
      secureUrl: "https://res.cloudinary.com/leco/photo-1.jpg",
      displayOrder: 1,
      moderationStatus: "pending",
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      secureUrl: "https://res.cloudinary.com/leco/photo-2.jpg",
      displayOrder: 2,
      moderationStatus: "pending",
    },
  ],
  interestIds: [1, 2],
};

const interests = [
  { id: 1, slug: "art", label: "Art" },
  { id: 2, slug: "cinema", label: "Cinéma" },
  { id: 3, slug: "sport", label: "Sport" },
];

describe("parcours onboarding", () => {
  beforeEach(() => {
    geolocation.errorMessage = null;
    geolocation.requestLocation.mockClear();
    geolocation.state = "idle";
  });

  it("reprend le parcours à l’étape sauvegardée", () => {
    render(<OnboardingFlow initialProfile={profile} interests={interests} />);
    expect(
      screen.getByRole("heading", {
        name: /qu’est-ce qui pourrait lancer la conversation/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("2", { selector: ".interest-counter > span" }),
    ).toBeInTheDocument();
  });

  it("charge les intérêts de la base et limite le choix à trois", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow initialProfile={profile} interests={interests} />);
    await user.click(screen.getByRole("button", { name: "Sport" }));
    expect(screen.getByRole("button", { name: "Sport" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("enregistre la position côté serveur depuis l’étape de localisation", async () => {
    const user = userEvent.setup();
    render(
      <OnboardingFlow
        initialProfile={{ ...profile, onboardingStep: 4 }}
        interests={interests}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Autoriser et enregistrer" }),
    );

    expect(geolocation.requestLocation).toHaveBeenCalledOnce();
    expect(screen.getByText(/aucun historique/i)).toBeInTheDocument();
  });

  it("explique une permission bloquée sans masquer la reprise", () => {
    geolocation.state = "blocked";
    geolocation.errorMessage =
      "L’accès est bloqué dans ton navigateur. Autorise Leco depuis les réglages du site.";

    render(
      <OnboardingFlow
        initialProfile={{ ...profile, onboardingStep: 4 }}
        interests={interests}
      />,
    );

    expect(screen.getByText("Permission bloquée")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/réglages du site/i);
    expect(
      screen.getByRole("button", { name: "Autoriser et enregistrer" }),
    ).toBeEnabled();
  });
});
