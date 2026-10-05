type IconProps = { className?: string };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function VerseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...common}>
      <path d="M10 8h16a2 2 0 0 1 2 2v20l-4-3H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z" />
      <path d="M14 16h12M14 21h8" />
    </svg>
  );
}

export function TimerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...common}>
      <circle cx="20" cy="22" r="12" />
      <path d="M20 22V15M20 22l6 4M16 6h8" />
    </svg>
  );
}

export function ReadingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...common}>
      <rect x="7" y="9" width="26" height="23" rx="2" />
      <path d="M7 16h26M14 9v-2M26 9v-2M13 22h4M13 27h8" />
    </svg>
  );
}

export function FastingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...common}>
      <path d="M20 7c4 5 7 9 7 14a7 7 0 1 1-14 0c0-2.5 1-4.5 2.4-6.4.3 2 1.3 3 2.6 3-0.6-4 .6-7.8 2-10.6Z" />
    </svg>
  );
}

export function FlashcardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...common}>
      <rect x="10" y="12" width="20" height="14" rx="2" transform="rotate(-6 20 19)" />
      <rect x="9" y="14" width="20" height="14" rx="2" />
    </svg>
  );
}

export function WorshipIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...common}>
      <circle cx="20" cy="20" r="13" />
      <path d="M17 14.5v11l9-5.5-9-5.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
