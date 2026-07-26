"use client";

import { FormEvent, useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  ChatIcon,
  CheckIcon,
  ChevronIcon,
  EyeIcon,
  FoodIcon,
  LockIcon,
  MoonIcon,
  MusicIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SparkIcon,
  UserIcon,
} from "@/components/ui/icons";

const moodOptions = [
  { icon: ChatIcon, id: "talk", label: "On peut causer" },
  { icon: MusicIcon, id: "out", label: "Sortir" },
  { icon: FoodIcon, id: "eat", label: "Manger" },
  { icon: MoonIcon, id: "quiet", label: "Plan tranquille" },
] as const;

export function VibeSurface() {
  const [active, setActive] = useState(true);
  const [duration, setDuration] = useState(45);
  const [mood, setMood] = useState("talk");
  const selectedMood =
    moodOptions.find((option) => option.id === mood) ?? moodOptions[0];

  return (
    <section aria-label="Ma vibe" className="app-surface app-surface--vibe">
      <div className="surface-meta">
        <Badge tone="coral">Aperçu interactif local</Badge>
        <span>Rien n’est publié sur un serveur</span>
      </div>

      <div className="vibe-workbench">
        <section aria-labelledby="mood-title" className="vibe-editor">
          <div className="section-heading">
            <div>
              <h2 id="mood-title">Choisis le ton de ta soirée</h2>
              <p>Une intention claire vaut mieux qu’un long profil.</p>
            </div>
            <label className="switch-control">
              <span>Visible</span>
              <input
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true" className="switch-control__track" />
            </label>
          </div>

          <div aria-label="Choix de la vibe" className="mood-grid">
            {moodOptions.map(({ icon: Icon, id, label }) => (
              <button
                aria-pressed={mood === id}
                className="mood-option"
                key={id}
                onClick={() => setMood(id)}
                type="button"
              >
                <Icon />
                <span>{label}</span>
                <CheckIcon className="mood-option__check" />
              </button>
            ))}
          </div>

          <div className="duration-control">
            <div className="duration-control__heading">
              <label htmlFor="vibe-duration">Durée de visibilité</label>
              <output htmlFor="vibe-duration">{duration} min</output>
            </div>
            <input
              id="vibe-duration"
              max="90"
              min="15"
              onChange={(event) => setDuration(Number(event.target.value))}
              step="15"
              type="range"
              value={duration}
            />
            <div aria-hidden="true" className="duration-control__scale">
              <span>15 min</span>
              <span>45 min</span>
              <span>90 min</span>
            </div>
          </div>

          <div className="vibe-editor__actions">
            <Button disabled={!active}>
              <SparkIcon />
              Activer cette vibe
            </Button>
            <p>
              Elle s’efface automatiquement; tu peux l’arrêter à tout moment.
            </p>
          </div>
        </section>

        <aside aria-label="Aperçu de la vibe" className="vibe-preview">
          <span className="surface-label">Ce que les autres voient</span>
          <div className="vibe-preview__identity">
            <Avatar
              initials="CK"
              label="Portrait abstrait de Cheick"
              online={active}
              tone="apricot"
            />
            <div>
              <h2>Cheick, 26</h2>
              <p>Dans ton secteur</p>
            </div>
          </div>
          <div className="vibe-preview__statement">
            <selectedMood.icon />
            <p>{selectedMood.label}</p>
          </div>
          <dl className="vibe-preview__facts">
            <div>
              <dt>Visible</dt>
              <dd>{active ? `${duration} min` : "Non"}</dd>
            </div>
            <div>
              <dt>Zone</dt>
              <dd>Approximative</dd>
            </div>
          </dl>
          <p className="vibe-preview__privacy">
            <LockIcon />
            La carte ne montre jamais ton point exact.
          </p>
        </aside>
      </div>
    </section>
  );
}

const conversations = [
  {
    id: "awa",
    initials: "AW",
    name: "Awa",
    preview: "La terrasse de Zone 4 me va.",
    time: "21:08",
    tone: "coral" as const,
    unread: true,
  },
  {
    id: "mariam",
    initials: "MA",
    name: "Mariam",
    preview: "Je t’envoie le nom de l’adresse.",
    time: "20:41",
    tone: "lilac" as const,
    unread: true,
  },
  {
    id: "yann",
    initials: "YN",
    name: "Yann",
    preview: "On se tient au courant après le match.",
    time: "Hier",
    tone: "apricot" as const,
    unread: false,
  },
];

export function MessagesSurface() {
  const [activeId, setActiveId] = useState("awa");
  const [draft, setDraft] = useState("");
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];

  function sendPreviewMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();

    if (!message) {
      return;
    }

    setSentMessage(message);
    setDraft("");
  }

  return (
    <section
      aria-label="Messages"
      className="app-surface app-surface--messages"
    >
      <div className="surface-meta">
        <Badge tone="coral">2 non lus · données fictives</Badge>
        <span>Demandes acceptées uniquement</span>
      </div>

      <div className="messages-workbench">
        <section
          aria-labelledby="conversations-title"
          className="conversation-list"
        >
          <div className="conversation-list__heading">
            <h2 id="conversations-title">Conversations</h2>
            <Button
              aria-label="Rechercher une conversation"
              size="icon"
              variant="quiet"
            >
              <SearchIcon />
            </Button>
          </div>
          <div className="conversation-list__items">
            {conversations.map((conversation) => (
              <button
                aria-pressed={conversation.id === activeId}
                className="conversation-row"
                key={conversation.id}
                onClick={() => {
                  setActiveId(conversation.id);
                  setSentMessage(null);
                }}
                type="button"
              >
                <Avatar
                  initials={conversation.initials}
                  label={`Portrait abstrait de ${conversation.name}`}
                  online
                  tone={conversation.tone}
                />
                <span className="conversation-row__copy">
                  <span>
                    <strong>{conversation.name}</strong>
                    <time>{conversation.time}</time>
                  </span>
                  <small>{conversation.preview}</small>
                </span>
                {conversation.unread ? (
                  <span
                    aria-label="Message non lu"
                    className="conversation-row__unread"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="thread-title" className="message-thread">
          <header className="message-thread__header">
            <Avatar
              initials={activeConversation.initials}
              label={`Portrait abstrait de ${activeConversation.name}`}
              online
              tone={activeConversation.tone}
            />
            <div>
              <h2 id="thread-title">{activeConversation.name}</h2>
              <p>Disponible maintenant</p>
            </div>
            <Button
              aria-label={`Voir le profil de ${activeConversation.name}`}
              size="icon"
              variant="quiet"
            >
              <UserIcon />
            </Button>
          </header>

          <div aria-live="polite" className="message-thread__body">
            <time>Ce soir · 20:56</time>
            <p className="message-bubble message-bubble--received">
              Tu préfères une terrasse calme ou un endroit avec un peu de son ?
            </p>
            <p className="message-bubble message-bubble--sent">
              Calme pour commencer. On pourra bouger après.
            </p>
            <p className="message-bubble message-bubble--received">
              La terrasse de Zone 4 me va.
            </p>
            {sentMessage ? (
              <p className="message-bubble message-bubble--sent">
                {sentMessage}
              </p>
            ) : null}
          </div>

          <form className="message-composer" onSubmit={sendPreviewMessage}>
            <label htmlFor="message-draft">
              Message pour {activeConversation.name}
            </label>
            <div>
              <input
                id="message-draft"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Écris une réponse"
                value={draft}
              />
              <Button
                aria-label="Envoyer le message dans l’aperçu local"
                disabled={!draft.trim()}
                size="icon"
              >
                <SendIcon />
              </Button>
            </div>
            <small>Aperçu local — rien n’est transmis.</small>
          </form>
        </section>
      </div>
    </section>
  );
}

const preferenceRows = [
  {
    description: "Mon secteur seulement, sans adresse ni distance exacte.",
    icon: EyeIcon,
    id: "visibility",
    label: "Visibilité maîtrisée",
  },
  {
    description: "Alerte uniquement pour une demande acceptée ou un message.",
    icon: BellIcon,
    id: "notifications",
    label: "Notifications utiles",
  },
  {
    description: "Profils signalés masqués immédiatement dans l’aperçu.",
    icon: ShieldIcon,
    id: "safety",
    label: "Protection renforcée",
  },
] as const;

export function ProfileSurface() {
  const [preferences, setPreferences] = useState(() =>
    Object.fromEntries(preferenceRows.map((row) => [row.id, true])),
  );
  const activeCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences],
  );

  return (
    <section aria-label="Profil" className="app-surface app-surface--profile">
      <div className="surface-meta">
        <Badge tone="success">Profil vérifié · aperçu</Badge>
        <span>{activeCount} protections actives</span>
      </div>

      <div className="profile-workbench">
        <section className="profile-overview">
          <div className="profile-overview__identity">
            <Avatar
              initials="CK"
              label="Portrait abstrait de Cheick"
              online
              tone="apricot"
            />
            <div>
              <span className="surface-label">Ton identité publique</span>
              <h2>Cheick, 26</h2>
              <p>Cocody · zone approximative</p>
            </div>
          </div>
          <p className="profile-overview__bio">
            Design, cuisine et bonnes conversations. Partant pour découvrir une
            adresse sans transformer la soirée en planning.
          </p>
          <ul aria-label="Centres d’intérêt">
            <li>Design</li>
            <li>Garba</li>
            <li>Afrobeats</li>
          </ul>
          <Button variant="secondary">Modifier le profil</Button>
        </section>

        <section
          aria-labelledby="privacy-settings-title"
          className="privacy-settings"
        >
          <div className="section-heading">
            <div>
              <h2 id="privacy-settings-title">Confidentialité par défaut</h2>
              <p>Des réglages compréhensibles, sans menus cachés.</p>
            </div>
            <LockIcon />
          </div>

          <div className="preference-list">
            {preferenceRows.map(({ description, icon: Icon, id, label }) => (
              <label className="preference-row" key={id}>
                <span className="preference-row__icon">
                  <Icon />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <input
                  checked={preferences[id]}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      [id]: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span aria-hidden="true" className="preference-row__control" />
              </label>
            ))}
          </div>
        </section>

        <section className="account-panel">
          <div>
            <span className="account-panel__icon">
              <CheckIcon />
            </span>
            <span>
              <strong>Vérification terminée</strong>
              <small>L’âge et l’identité ont été contrôlés.</small>
            </span>
          </div>
          <button type="button">
            Voir les détails
            <ChevronIcon />
          </button>
        </section>
      </div>
    </section>
  );
}
