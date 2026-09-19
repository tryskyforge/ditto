interface MascotIconProps {
  size?: number;
  pose?: 'happy' | 'lookaway';
  tone?: 'brand' | 'muted';
}

export default function MascotIcon({ size = 22, pose = 'happy', tone = 'brand' }: MascotIconProps) {
  const muted = tone === 'muted';
  const body = muted ? 'fill-current opacity-55' : 'fill-primary';
  const crown = muted ? 'fill-current opacity-80' : 'fill-violet-mid';
  const seam = muted ? 'fill-current opacity-25' : 'fill-lavender';
  const feature = muted ? 'fill-card stroke-card' : 'fill-lavender stroke-lavender';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="20 50 160 120"
      width={size}
      height={Math.round((size * 120) / 160)}
      className="block shrink-0"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="mascot-crown-split">
          <path d="M30 95 L170 60 L170 95 Z" />
        </clipPath>
      </defs>
      <rect x="30" y="95" width="140" height="68" rx="5" className={body} />
      <path d="M30 95 L30 80 Q30 60, 100 60 Q170 60, 170 80 L170 95 Z" className={crown} />
      {!muted && (
        <path
          d="M30 95 L30 80 Q30 60, 100 60 Q170 60, 170 80 L170 95 Z"
          className="fill-accent"
          clipPath="url(#mascot-crown-split)"
        />
      )}
      <rect x="30" y="93" width="140" height="3" className={seam} />

      {pose === 'lookaway' ? (
        <>
          <circle cx="80" cy="124" r="5" className={feature} strokeWidth="0" />
          <circle cx="128" cy="124" r="5" className={feature} strokeWidth="0" />
          <path d="M86 141 Q100 136 116 141" className={feature} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M68 122 Q76 112 84 122" className={feature} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M116 122 Q124 112 132 122" className={feature} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M84 138 Q100 148 116 138" className={feature} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
