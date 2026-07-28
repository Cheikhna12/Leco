import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { updateCurrentLocation } from "@/features/locations/client";
import { geolocationErrorState, useGeolocation } from "@/hooks/use-geolocation";

vi.mock("@/features/locations/client", () => ({
  updateCurrentLocation: vi.fn().mockResolvedValue({
    locationStatus: "AVAILABLE",
    updated: true,
  }),
}));

const updateLocationMock = vi.mocked(updateCurrentLocation);

function mockGeolocation(
  implementation: Geolocation["getCurrentPosition"],
): void {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: implementation },
  });
}

function mockPermission(state: PermissionState): void {
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: {
      query: vi.fn().mockResolvedValue({
        addEventListener: vi.fn(),
        onchange: null,
        removeEventListener: vi.fn(),
        state,
      }),
    },
  });
}

describe("useGeolocation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    updateLocationMock.mockClear();
  });

  it("ne demande rien au premier rendu", () => {
    const getCurrentPosition = vi.fn();
    mockGeolocation(getCurrentPosition);
    mockPermission("prompt");

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.state).toBe("idle");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("envoie une position accordée sans la conserver dans l’état public", async () => {
    mockPermission("granted");
    mockGeolocation((success) =>
      success({
        coords: {
          accuracy: 24,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 5.3364,
          longitude: -4.0267,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      }),
    );
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.requestLocation());

    expect(result.current.state).toBe("ready");
    expect(updateLocationMock).toHaveBeenCalledOnce();
    expect(result.current).not.toHaveProperty("latitude");
    expect(result.current).not.toHaveProperty("longitude");
  });

  it("distingue un refus d’une permission bloquée", () => {
    expect(geolocationErrorState({ code: 1 }, "prompt")).toBe("denied");
    expect(geolocationErrorState({ code: 1 }, "denied")).toBe("blocked");
  });

  it("n’appelle pas le GPS lorsque la permission est bloquée", async () => {
    const getCurrentPosition = vi.fn();
    mockPermission("denied");
    mockGeolocation(getCurrentPosition);
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.requestLocation());

    expect(result.current.state).toBe("blocked");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("utilise le dialogue GPS si l’API Permissions est incomplète", async () => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        query: vi.fn().mockRejectedValue(new TypeError("Not supported")),
      },
    });
    const getCurrentPosition = vi.fn((success) =>
      success({
        coords: {
          accuracy: 24,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 5.3364,
          longitude: -4.0267,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      }),
    );
    mockGeolocation(getCurrentPosition);
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.requestLocation());

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(result.current.state).toBe("ready");
  });

  it("explique pourquoi une adresse réseau HTTP ne peut pas localiser", async () => {
    const previousDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "isSecureContext",
    );
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
    const getCurrentPosition = vi.fn();
    mockGeolocation(getCurrentPosition);

    try {
      const { result } = renderHook(() => useGeolocation());

      await act(() => result.current.requestLocation());

      expect(result.current.state).toBe("insecure");
      expect(result.current.errorMessage).toMatch(/HTTPS/i);
      expect(getCurrentPosition).not.toHaveBeenCalled();
    } finally {
      if (previousDescriptor) {
        Object.defineProperty(window, "isSecureContext", previousDescriptor);
      } else {
        Reflect.deleteProperty(window, "isSecureContext");
      }
    }
  });

  it.each([
    [2, "unavailable"],
    [3, "timeout"],
  ] as const)("traduit l’erreur GPS %s en %s", async (code, state) => {
    mockPermission("prompt");
    mockGeolocation((_success, failure) =>
      failure?.({
        code,
        message: "private browser detail",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }),
    );
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.requestLocation());

    expect(result.current.state).toBe(state);
  });

  it("refuse un signal trop imprécis avant l’envoi", async () => {
    mockPermission("granted");
    mockGeolocation((success) =>
      success({
        coords: {
          accuracy: 800,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 5.3364,
          longitude: -4.0267,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      }),
    );
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.requestLocation());

    expect(result.current.state).toBe("inaccurate");
    expect(updateLocationMock).not.toHaveBeenCalled();
  });

  it("conserve le message public renvoyé par l’API", async () => {
    mockPermission("granted");
    mockGeolocation((success) =>
      success({
        coords: {
          accuracy: 24,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 5.3364,
          longitude: -4.0267,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      }),
    );
    updateLocationMock.mockRejectedValueOnce(
      new Error("Reconnecte-toi pour continuer."),
    );
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.requestLocation());

    expect(result.current.state).toBe("error");
    expect(result.current.errorMessage).toBe(
      "Reconnecte-toi pour continuer.",
    );
  });

  it("signale un navigateur incompatible", () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.state).toBe("unsupported");
  });
});
