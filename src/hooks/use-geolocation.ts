"use client";

import { useCallback, useState } from "react";

import { updateCurrentLocation } from "@/features/locations/client";
import { MAX_LOCATION_ACCURACY_METERS } from "@/features/presence/domain";

export type GeolocationState =
  | "idle"
  | "checking"
  | "requesting"
  | "ready"
  | "insecure"
  | "denied"
  | "blocked"
  | "unavailable"
  | "timeout"
  | "inaccurate"
  | "unsupported"
  | "error";

export interface GeolocationController {
  state: GeolocationState;
  errorMessage: string | null;
  requestLocation: () => Promise<boolean>;
  reset: () => void;
}

function locate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12_000,
    });
  });
}

export function geolocationErrorState(
  error: Pick<GeolocationPositionError, "code">,
  permissionState?: PermissionState,
): GeolocationState {
  if (error.code === 1) {
    return permissionState === "denied" ? "blocked" : "denied";
  }

  if (error.code === 2) {
    return "unavailable";
  }

  if (error.code === 3) {
    return "timeout";
  }

  return "error";
}

export const GEOLOCATION_MESSAGES: Readonly<
  Partial<Record<GeolocationState, string>>
> = {
  blocked:
    "L’accès est bloqué dans ton navigateur. Autorise Leco depuis les réglages du site.",
  denied: "Tu as refusé l’accès. Rien n’a été enregistré.",
  error: "La position n’a pas pu être vérifiée. Réessaie dans un instant.",
  insecure:
    "La localisation est bloquée sur une adresse HTTP. Ouvre Leco en HTTPS ou utilise localhost sur cet appareil.",
  inaccurate:
    "Le signal est trop imprécis. Place-toi près d’une fenêtre puis réessaie.",
  timeout:
    "Le GPS met trop de temps à répondre. Vérifie ton signal puis réessaie.",
  unavailable:
    "Ton appareil ne trouve pas sa position pour le moment. Réessaie dehors ou active le GPS.",
  unsupported: "Ce navigateur ne prend pas en charge la géolocalisation.",
};

export function useGeolocation(): GeolocationController {
  const insecure =
    typeof window !== "undefined" && window.isSecureContext === false;
  const unsupported =
    typeof navigator !== "undefined" && !navigator.geolocation;
  const [state, setState] = useState<GeolocationState>(
    insecure ? "insecure" : unsupported ? "unsupported" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    insecure
      ? (GEOLOCATION_MESSAGES.insecure ?? null)
      : unsupported
        ? (GEOLOCATION_MESSAGES.unsupported ?? null)
        : null,
  );

  const reset = useCallback(() => {
    const isInsecure = window.isSecureContext === false;
    setState(isInsecure ? "insecure" : "idle");
    setErrorMessage(
      isInsecure ? (GEOLOCATION_MESSAGES.insecure ?? null) : null,
    );
  }, []);

  const requestLocation = useCallback(async () => {
    if (window.isSecureContext === false) {
      setState("insecure");
      setErrorMessage(GEOLOCATION_MESSAGES.insecure ?? null);
      return false;
    }

    if (!navigator.geolocation) {
      setState("unsupported");
      setErrorMessage(GEOLOCATION_MESSAGES.unsupported ?? null);
      return false;
    }

    setState("checking");
    setErrorMessage(null);
    let permissionState: PermissionState | undefined;

    try {
      if ("permissions" in navigator) {
        try {
          permissionState = (
            await navigator.permissions.query({ name: "geolocation" })
          ).state;
        } catch {
          // Certains navigateurs exposent l’API Permissions sans prendre en
          // charge la requête "geolocation". Le dialogue GPS natif reste la
          // source de vérité dans ce cas.
          permissionState = undefined;
        }

        if (permissionState === "denied") {
          setState("blocked");
          setErrorMessage(GEOLOCATION_MESSAGES.blocked ?? null);
          return false;
        }
      }

      setState("requesting");
      const position = await locate();

      if (position.coords.accuracy > MAX_LOCATION_ACCURACY_METERS) {
        setState("inaccurate");
        setErrorMessage(GEOLOCATION_MESSAGES.inaccurate ?? null);
        return false;
      }

      await updateCurrentLocation({
        accuracy: position.coords.accuracy,
        capturedAt: new Date(position.timestamp).toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setState("ready");
      return true;
    } catch (error) {
      const nextState =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "number"
          ? geolocationErrorState(
              error as Pick<GeolocationPositionError, "code">,
              permissionState,
            )
          : "error";
      setState(nextState);
      setErrorMessage(
        nextState === "error" && error instanceof Error
          ? error.message
          : (GEOLOCATION_MESSAGES[nextState] ?? null),
      );
      return false;
    }
  }, []);

  return { state, errorMessage, requestLocation, reset };
}
