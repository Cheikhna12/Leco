import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 2.75c.46 4.12 2.63 6.3 6.75 6.75-4.12.46-6.3 2.63-6.75 6.75-.46-4.12-2.63-6.3-6.75-6.75C9.37 9.04 11.54 6.87 12 2.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M18.25 15.5c.2 1.81 1.19 2.8 3 3-1.81.2-2.8 1.19-3 3-.2-1.81-1.19-2.8-3-3 1.81-.2 2.8-1.19 3-3Z"
        fill="currentColor"
      />
    </IconFrame>
  );
}

export function VibeIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
      <path
        d="M8.45 8.45a5.02 5.02 0 0 0 0 7.1M15.55 8.45a5.02 5.02 0 0 1 0 7.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
      <path
        d="M5.4 5.55a9.05 9.05 0 0 0 0 12.9M18.6 5.55a9.05 9.05 0 0 1 0 12.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </IconFrame>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle
        cx="12"
        cy="12"
        r="8.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="m14.9 8.4-1.62 4.88-4.88 1.63 1.62-4.89L14.9 8.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </IconFrame>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H11l-4.85 3.55.82-3.55h-.22A2.75 2.75 0 0 1 4 13.25v-7.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M8 8h8M8 11.25h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </IconFrame>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle
        cx="12"
        cy="8.25"
        r="3.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.75 20c.54-3.56 3.25-5.75 7.25-5.75S18.71 16.44 19.25 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </IconFrame>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M4 7h10M18 7h2M4 17h2M10 17h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
      <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="8" cy="17" r="2" stroke="currentColor" strokeWidth="1.75" />
    </IconFrame>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M8.1 11.3V5.1a1.55 1.55 0 0 1 3.1 0v4.4-6.1a1.55 1.55 0 0 1 3.1 0v6.1-4.7a1.55 1.55 0 0 1 3.1 0v6-2.9a1.55 1.55 0 0 1 3.1 0v4.15c0 5.1-3.18 8.2-8.07 8.2-3.05 0-4.76-1.53-6.45-3.55L3.7 13.98a1.76 1.76 0 0 1 2.7-2.25l1.7 1.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </IconFrame>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 2.8 19 5.6v5.2c0 4.65-2.67 8.1-7 10.4-4.33-2.3-7-5.75-7-10.4V5.6l7-2.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m8.75 11.85 2.08 2.08 4.42-4.42"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M19.25 7.4V3.75h-3.65M4.75 16.6v3.65H8.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M18.4 10a7 7 0 0 0-11.93-3.53L4.75 8.2M5.6 14a7 7 0 0 0 11.93 3.53l1.72-1.72"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </IconFrame>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 3.25 21 19H3l9-15.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M12 8v5.25M12 16.7v.05"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </IconFrame>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M5 12h13M14 7l5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconFrame>
  );
}

export function RadarIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <circle
        cx="12"
        cy="12"
        r="4.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M12 12 17.8 6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="16.1" cy="8" r="1.3" fill="currentColor" />
    </IconFrame>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M18.9 15.1A7.8 7.8 0 0 1 8.9 5.1a8.25 8.25 0 1 0 10 10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function FoodIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M6.7 3.5v7.1M4.3 3.5v4.1c0 1.65 1.05 3 2.4 3s2.4-1.35 2.4-3V3.5M6.7 10.6v9.9M15.4 20.5v-6.7M15.4 13.8c2.4 0 4.1-2 4.1-5.05S17.8 3.5 15.4 3.5v10.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </IconFrame>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M9 17.2V6.5l10-2v10.2M9 8.8l10-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <ellipse
        cx="6.5"
        cy="17.5"
        rx="2.5"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <ellipse
        cx="16.5"
        cy="15"
        rx="2.5"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.4v5l3.3 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.2 10V7.6a3.8 3.8 0 1 1 7.6 0V10M12 14v2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M5.7 16.4h12.6l-1.45-2.1V10a4.85 4.85 0 0 0-9.7 0v4.3L5.7 16.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9.8 19a2.35 2.35 0 0 0 4.4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconFrame>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="m3.5 5 17 7-17 7 2.3-5.2L14 12 5.8 10.2 3.5 5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </IconFrame>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M2.8 12s3.4-5.3 9.2-5.3 9.2 5.3 9.2 5.3-3.4 5.3-9.2 5.3S2.8 12 2.8 12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <circle
        cx="12"
        cy="12"
        r="2.4"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </IconFrame>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 21s6.4-5.65 6.4-11.2a6.4 6.4 0 1 0-12.8 0C5.6 15.35 12 21 12 21Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <circle
        cx="12"
        cy="9.8"
        r="2.15"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </IconFrame>
  );
}

export function ThemeIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.8 5.8l1.5 1.5M16.7 16.7l1.5 1.5M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="m5 12.4 4.2 4.2L19.4 6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconFrame>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="5" cy="12" r="1.25" fill="currentColor" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <circle cx="19" cy="12" r="1.25" fill="currentColor" />
    </IconFrame>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m15.4 15.4 4.1 4.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.3 13.5v-3l-2-.6a6.7 6.7 0 0 0-.7-1.6l1-1.9-2.1-2.1-1.9 1a6.7 6.7 0 0 0-1.6-.7l-.6-2h-3l-.6 2a6.7 6.7 0 0 0-1.6.7l-1.9-1-2.1 2.1 1 1.9a6.7 6.7 0 0 0-.7 1.6l-2 .6v3l2 .6c.16.57.4 1.1.7 1.6l-1 1.9 2.1 2.1 1.9-1c.5.3 1.03.54 1.6.7l.6 2h3l.6-2c.57-.16 1.1-.4 1.6-.7l1.9 1 2.1-2.1-1-1.9c.3-.5.54-1.03.7-1.6l2-.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </IconFrame>
  );
}
