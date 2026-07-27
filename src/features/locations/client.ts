import type { LocationUpdateInput } from "@/features/presence/domain";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export class PresenceApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PresenceApiError";
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ApiErrorBody;

  if (!response.ok) {
    throw new PresenceApiError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "La demande n’a pas pu aboutir.",
    );
  }

  return body;
}

export async function updateCurrentLocation(input: LocationUpdateInput) {
  const response = await fetch("/api/location", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return readResponse<{
    updated: true;
    locationStatus: "AVAILABLE";
  }>(response);
}
