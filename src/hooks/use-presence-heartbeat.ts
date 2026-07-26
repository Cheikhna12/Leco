"use client";

import { useEffect, useRef } from "react";

import { PresenceApiError } from "@/features/locations/client";
import { heartbeatCurrentPresence } from "@/features/presence/client";
import { HEARTBEAT_INTERVAL_MS } from "@/features/presence/domain";

export interface PresenceHeartbeatOptions {
  active: boolean;
  availableUntil: string | null;
  onExpired: () => void;
  onSessionEnded: () => void;
  onHeartbeat?: (availableUntil: string) => void;
}

export function usePresenceHeartbeat({
  active,
  availableUntil,
  onExpired,
  onHeartbeat,
  onSessionEnded,
}: PresenceHeartbeatOptions): void {
  const inFlight = useRef(false);

  useEffect(() => {
    if (!active || !availableUntil) {
      return;
    }

    let stopped = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      clearTimeout(timeout);
      timeout = setTimeout(runHeartbeat, HEARTBEAT_INTERVAL_MS);
    };

    const runHeartbeat = async () => {
      if (
        stopped ||
        inFlight.current ||
        document.visibilityState === "hidden"
      ) {
        schedule();
        return;
      }

      if (Date.parse(availableUntil) <= Date.now()) {
        stopped = true;
        onExpired();
        return;
      }

      inFlight.current = true;

      try {
        const result = await heartbeatCurrentPresence();
        onHeartbeat?.(result.availableUntil);
      } catch (error) {
        if (error instanceof PresenceApiError && error.status === 401) {
          stopped = true;
          onSessionEnded();
          return;
        }

        if (error instanceof PresenceApiError && error.status === 403) {
          stopped = true;
          onExpired();
          return;
        }
      } finally {
        inFlight.current = false;
      }

      if (!stopped) {
        schedule();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runHeartbeat();
      }
    };
    const handleSessionEnded = () => {
      stopped = true;
      clearTimeout(timeout);
      onSessionEnded();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("leco:session-ended", handleSessionEnded);
    schedule();

    return () => {
      stopped = true;
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("leco:session-ended", handleSessionEnded);
    };
  }, [active, availableUntil, onExpired, onHeartbeat, onSessionEnded]);
}
