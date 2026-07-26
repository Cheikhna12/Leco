import type { ReactNode } from "react";

import "./auth.css";

export default function AuthenticationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
