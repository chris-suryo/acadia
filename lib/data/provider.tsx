"use client";

import { DATA_MODE } from "@/lib/config";
import { MockProvider } from "./mock-impl";
import { SupabaseProvider } from "./supabase-impl";

export function DataProvider({ children }: { children: React.ReactNode }) {
  if (DATA_MODE === "mock") return <MockProvider>{children}</MockProvider>;
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
