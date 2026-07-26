import type {
  ActivatePresenceInput,
  PresenceSnapshot,
} from "@/features/presence/domain";
import { PresenceApiError } from "@/features/locations/client";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
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

export async function getPresenceSnapshot(): Promise<PresenceSnapshot> {
  return readResponse<PresenceSnapshot>(
    await fetch("/api/presence", {
      cache: "no-store",
      credentials: "same-origin",
    }),
  );
}

export async function activateCurrentPresence(input: ActivatePresenceInput) {
  return readResponse<{
    active: true;
    status: "AVAILABLE";
    availableUntil: string;
  }>(
    await fetch("/api/presence", {
      body: JSON.stringify(input),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

export async function deactivateCurrentPresence() {
  return readResponse<{ active: false; status: "OFFLINE" }>(
    await fetch("/api/presence", {
      credentials: "same-origin",
      method: "DELETE",
    }),
  );
}

export async function heartbeatCurrentPresence() {
  return readResponse<{
    active: true;
    status: "AVAILABLE";
    availableUntil: string;
  }>(
    await fetch("/api/presence/heartbeat", {
      credentials: "same-origin",
      method: "POST",
    }),
  );
}
