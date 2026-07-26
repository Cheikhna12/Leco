"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getPublicSupabaseConfig } from "./config";

export function createClient() {
  const { publishableKey, url } = getPublicSupabaseConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
