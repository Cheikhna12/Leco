"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserIcon, VibeIcon } from "@/components/ui/icons";

import styles from "./app-bottom-navigation.module.css";

const destinations = [
  {
    href: "/presence",
    icon: VibeIcon,
    label: "Ma vibe",
  },
  {
    href: "/profil",
    icon: UserIcon,
    label: "Profil",
  },
] as const;

export function AppBottomNavigation() {
  const pathname = usePathname();

  return (
    <>
      <div aria-hidden="true" className={styles.clearance} />
      <nav aria-label="Navigation de l’application" className={styles.dock}>
        {destinations.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={styles.link}
              href={href}
              key={href}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
