import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { heartbeatCurrentPresence } from "@/features/presence/client";
import { HEARTBEAT_INTERVAL_MS } from "@/features/presence/domain";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";

vi.mock("@/features/presence/client", () => ({
  heartbeatCurrentPresence: vi.fn(),
}));

const heartbeatMock = vi.mocked(heartbeatCurrentPresence);

describe("heartbeat de présence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    heartbeatMock.mockResolvedValue({
      active: true,
      availableUntil: new Date(Date.now() + 120_000).toISOString(),
      status: "AVAILABLE",
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("attend 50 secondes et n’empile pas les appels", async () => {
    let resolveRequest:
      | ((value: {
          active: true;
          availableUntil: string;
          status: "AVAILABLE";
        }) => void)
      | undefined;
    heartbeatMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { unmount } = renderHook(() =>
      usePresenceHeartbeat({
        active: true,
        availableUntil: new Date(Date.now() + 180_000).toISOString(),
        onExpired: vi.fn(),
        onSessionEnded: vi.fn(),
      }),
    );

    await act(() => vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS));
    await act(() => vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 2));
    expect(heartbeatMock).toHaveBeenCalledOnce();

    resolveRequest?.({
      active: true,
      availableUntil: new Date(Date.now() + 120_000).toISOString(),
      status: "AVAILABLE",
    });
    await act(() => Promise.resolve());
    unmount();
  });

  it("ne démarre pas après une désactivation", async () => {
    renderHook(() =>
      usePresenceHeartbeat({
        active: false,
        availableUntil: null,
        onExpired: vi.fn(),
        onSessionEnded: vi.fn(),
      }),
    );

    await act(() => vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 3));
    expect(heartbeatMock).not.toHaveBeenCalled();
  });

  it("suspend l’appel dans un onglet masqué et reprend à la visibilité", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    renderHook(() =>
      usePresenceHeartbeat({
        active: true,
        availableUntil: new Date(Date.now() + 180_000).toISOString(),
        onExpired: vi.fn(),
        onSessionEnded: vi.fn(),
      }),
    );

    await act(() => vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS));
    expect(heartbeatMock).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(heartbeatMock).toHaveBeenCalledOnce();
  });

  it("expire localement sans appeler le serveur après la durée", async () => {
    const onExpired = vi.fn();
    renderHook(() =>
      usePresenceHeartbeat({
        active: true,
        availableUntil: new Date(Date.now() + 1_000).toISOString(),
        onExpired,
        onSessionEnded: vi.fn(),
      }),
    );

    await act(() => vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS));

    expect(onExpired).toHaveBeenCalledOnce();
    expect(heartbeatMock).not.toHaveBeenCalled();
  });
});
