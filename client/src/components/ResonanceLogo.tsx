interface Props {
  className?: string;
}

export function ResonanceLogo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1"  y="8"  width="2.5" height="4"  rx="1.25" fill="currentColor" opacity="0.6"/>
      <rect x="5"  y="5"  width="2.5" height="10" rx="1.25" fill="currentColor" opacity="0.8"/>
      <rect x="9"  y="2"  width="2.5" height="16" rx="1.25" fill="currentColor"/>
      <rect x="13" y="5"  width="2.5" height="10" rx="1.25" fill="currentColor" opacity="0.8"/>
      <rect x="17" y="8"  width="2.5" height="4"  rx="1.25" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}
