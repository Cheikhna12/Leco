"use client";

import { useCallback, useEffect, useState } from "react";

import {
  activateCurrentPresence,
  deactivateCurrentPresence,
  getPresenceSnapshot,
} from "@/features/presence/client";
import type {
  ActivatePresenceInput,
  PresenceSnapshot,
} from "@/features/presence/domain";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";

const OFFLINE_SNAPSHOT: PresenceSnapshot = {
  availableUntil: null,
  hasValidLocation: false,
  mood: null,
  status: "OFFLINE",
};

export function usePresence() {
  const [snapshot, setSnapshot] = useState<PresenceSnapshot>(OFFLINE_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void getPresenceSnapshot()
      .then((value) => {
        if (mounted) {
          setSnapshot(value);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("L’état de ta présence n’a pas pu être chargé.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activate = useCallback(async (input: ActivatePresenceInput) => {
    setPending(true);
    setError(null);

    try {
      const result = await activateCurrentPresence(input);
      setSnapshot({
        availableUntil: result.availableUntil,
        hasValidLocation: true,
        mood: input.mood,
        status: "AVAILABLE",
      });
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ta présence n’a pas pu être activée.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const deactivate = useCallback(async () => {
    setPending(true);
    setError(null);

    try {
      await deactivateCurrentPresence();
      setSnapshot(OFFLINE_SNAPSHOT);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ta présence n’a pas pu être désactivée.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const expire = useCallback(() => {
    setSnapshot(OFFLINE_SNAPSHOT);
  }, []);
  const sessionEnded = useCallback(() => {
    setSnapshot(OFFLINE_SNAPSHOT);
    setError("Ta session a expiré. Reconnecte-toi pour continuer.");
  }, []);
  const heartbeat = useCallback((availableUntil: string) => {
    setSnapshot((current) => ({ ...current, availableUntil }));
  }, []);

  usePresenceHeartbeat({
    active: snapshot.status === "AVAILABLE",
    availableUntil: snapshot.availableUntil,
    onExpired: expire,
    onHeartbeat: heartbeat,
    onSessionEnded: sessionEnded,
  });

  return {
    activate,
    deactivate,
    error,
    loading,
    pending,
    snapshot,
  };
}
