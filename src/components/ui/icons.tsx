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
