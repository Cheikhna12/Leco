import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OtpForm } from "@/components/auth/otp-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("formulaire OTP accessible", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("leco:otp-phone", "+2250701020304");
    replace.mockClear();
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("répartit un code collé dans les six champs", async () => {
    render(<OtpForm />);
    const group = screen
      .getByLabelText("Chiffre 1 sur 6")
      .closest(".otp-inputs");

    fireEvent.paste(group!, {
      clipboardData: { getData: () => "12 34-56" },
    });

    for (let index = 1; index <= 6; index += 1) {
      expect(screen.getByLabelText(`Chiffre ${index} sur 6`)).toHaveValue(
        String(index),
      );
    }
  });

  it("crée la session puis suit la destination serveur", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          authenticated: true,
          destination: "/onboarding",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<OtpForm />);

    const group = screen
      .getByLabelText("Chiffre 1 sur 6")
      .closest(".otp-inputs");
    fireEvent.paste(group!, {
      clipboardData: { getData: () => "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmer le code/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
    expect(sessionStorage.getItem("leco:otp-phone")).toBeNull();
  });
});
