import type { ReactNode } from "react";

import { AppBottomNavigation } from "@/components/navigation/app-bottom-navigation";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AppBottomNavigation />
    </>
  );
}
