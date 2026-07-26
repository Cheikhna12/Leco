import type { ReactNode } from "react";

import "./onboarding.css";

export default function OnboardingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
