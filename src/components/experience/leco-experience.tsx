"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";

import { DiscoveryPreview } from "@/components/discovery/discovery-preview";
import {
  AppNavigation,
  type AppView,
} from "@/components/navigation/app-navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  ClockIcon,
  LockIcon,
  ShieldIcon,
} from "@/components/ui/icons";

import { MessagesSurface, ProfileSurface, VibeSurface } from "./surfaces";

const viewCopy: Record<
  AppView,
  { description: string; label: string; title: string }
> = {
  discover: {
    description:
      "Découvre les personnes disponibles sans exposer leur position exacte.",
    label: "Ce soir à Abidjan",
    title: "Qui est partant, maintenant ?",
  },
  vibe: {
    description:
      "Une intention temporaire, visible seulement dans un secteur approximatif.",
    label: "Présence temporaire",
    title: "Pose ta vibe. Vis ta soirée.",
  },
  messages: {
    description:
      "Les échanges commencent uniquement après une demande acceptée.",
    label: "Demandes mutuelles",
    title: "Des conversations qui comptent.",
  },
  profile: {
    description:
      "Choisis ce qui est visible, pendant combien de temps et pour qui.",
    label: "Contrôle du profil",
    title: "Ce que tu montres reste ton choix.",
  },
};

export function LecoExperience() {
  const [activeView, setActiveView] = useState<AppView>("discover");
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);
  const currentView = viewCopy[activeView];

  useEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [theme]);

  function navigate(view: AppView) {
    setActiveView(view);
    window.scrollTo({ behavior: "auto", top: 0 });
  }

  function toggleTheme() {
    setTheme((current) => {
      const activeTheme =
        current ??
        (window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark");
      return activeTheme === "dark" ? "light" : "dark";
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      <div className="app-frame">
        <AppNavigation
          activeView={activeView}
          onNavigate={navigate}
          onThemeToggle={toggleTheme}
        />

        <div className="app-stage">
          <header className="app-header">
            <div className="app-header__copy">
              <span className="surface-label">{currentView.label}</span>
              <h1>{currentView.title}</h1>
              <p>{currentView.description}</p>
            </div>
            <div className="app-header__actions">
              <Badge tone="neutral">Aperçu privé</Badge>
              <Button
                aria-label="Voir les notifications"
                size="icon"
                variant="secondary"
              >
                <BellIcon />
              </Button>
              <Avatar
                initials="CK"
                label="Portrait abstrait de Cheick"
                online
                tone="apricot"
              />
            </div>
          </header>

          <main id="main-content" tabIndex={-1}>
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                animate={{ opacity: 1 }}
                className="view-transition"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={activeView}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {activeView === "discover" ? (
                  <DiscoveryPreview onOpenVibe={() => navigate("vibe")} />
                ) : null}
                {activeView === "vibe" ? <VibeSurface /> : null}
                {activeView === "messages" ? <MessagesSurface /> : null}
                {activeView === "profile" ? <ProfileSurface /> : null}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="app-footer">
            <p>Leco · aperçu local · confidentialité par défaut</p>
            <p>Abidjan · 2026</p>
          </footer>
        </div>

        <aside aria-label="Contexte de la soirée" className="context-rail">
          <div className="context-rail__status">
            <span aria-hidden="true" />
            Présence active
          </div>
          <div className="context-rail__time">
            <ClockIcon />
            <span>
              <strong>45 min</strong>
              <small>avant expiration</small>
            </span>
          </div>
          <div className="context-rail__people">
            <span className="surface-label">À proximité</span>
            <div aria-hidden="true">
              <Avatar initials="AW" label="" online tone="coral" />
              <Avatar initials="YN" label="" online tone="apricot" />
              <Avatar initials="MA" label="" online tone="lilac" />
            </div>
            <p>3 présences fictives dans un secteur approximatif.</p>
          </div>
          <div className="context-rail__promise">
            <ShieldIcon />
            <h2>La carte reste floue. Ton intention, elle, est claire.</h2>
            <p>
              Leco limite volontairement ce que chacun peut déduire de ta
              position.
            </p>
          </div>
          <div className="context-rail__lock">
            <LockIcon />
            Chiffrement prévu en vague produit
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}
