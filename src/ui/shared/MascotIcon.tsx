interface MascotIconProps {
  size?: number;
  pose?: 'happy' | 'lookaway' | 'sad' | 'cool';
  tone?: 'brand' | 'muted';
  coffee?: boolean;
  className?: string;
}

const INK = '#22232B';
const FUR = '#FBF8F2';
const BLUSH = '#F2B8B5';
const SCARF = '#6E9A5E';
const SCARF_DARK = '#4F7A45';
const CUP = '#FFFFFF';
const CUP_SHADE = '#E6E1D6';
const COFFEE = '#5C3A21';
const STEAM = '#9DBB8F';

// Cosy panda mascot, drawn on a 128×128 canvas. `coffee` adds the mug held in
// both paws (the same drawing as the extension icon); without it the head fills
// the canvas. `tone="muted"` renders in currentColor for placeholders.
export default function MascotIcon({
  size = 22,
  pose = 'happy',
  tone = 'brand',
  coffee = false,
  className = '',
}: MascotIconProps) {
  const muted = tone === 'muted';
  const ink = muted ? 'currentColor' : INK;
  const fur = muted ? 'var(--color-card)' : FUR;
  const scarf = muted ? 'currentColor' : SCARF;
  const scarfDark = muted ? 'currentColor' : SCARF_DARK;

  // Head placement: scaled and lifted when the cup takes the lower third.
  const k = coffee ? 0.84 : 1;
  const cx = 64;
  const cy = coffee ? 50 : 62;
  const X = (x: number) => cx + (x - 64) * k;
  const Y = (y: number) => cy + (y - 66) * k;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={`block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* ears */}
      <circle cx={X(33)} cy={Y(34)} r={18 * k} fill={ink} />
      <circle cx={X(95)} cy={Y(34)} r={18 * k} fill={ink} />
      {/* head */}
      <ellipse cx={X(64)} cy={Y(66)} rx={45 * k} ry={41 * k} fill={fur} stroke={muted ? ink : 'none'} strokeWidth="2" />
      {/* scarf */}
      <path
        d={`M${X(20)} ${Y(96)} Q${X(64)} ${Y(124)} ${X(108)} ${Y(96)} L${X(108)} ${Y(112)} Q${X(64)} ${Y(138)} ${X(20)} ${Y(112)} Z`}
        fill={scarf}
        opacity={muted ? 0.45 : 1}
      />
      <path
        d={`M${X(20)} ${Y(96)} Q${X(64)} ${Y(124)} ${X(108)} ${Y(96)}`}
        stroke={scarfDark}
        strokeWidth={3 * k}
        fill="none"
        opacity={muted ? 0.6 : 1}
      />
      {/* eye patches */}
      <ellipse cx={X(46)} cy={Y(64)} rx={13 * k} ry={15 * k} fill={ink} transform={`rotate(-15 ${X(46)} ${Y(64)})`} />
      <ellipse cx={X(82)} cy={Y(64)} rx={13 * k} ry={15 * k} fill={ink} transform={`rotate(15 ${X(82)} ${Y(64)})`} />
      {/* eyes */}
      {pose === 'happy' && (
        <>
          <path
            d={`M${X(40)} ${Y(63)} Q${X(46)} ${Y(68)} ${X(52)} ${Y(63)}`}
            stroke={fur}
            strokeWidth={3.2 * k}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${X(76)} ${Y(63)} Q${X(82)} ${Y(68)} ${X(88)} ${Y(63)}`}
            stroke={fur}
            strokeWidth={3.2 * k}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {(pose === 'lookaway' || pose === 'sad') && (
        <>
          <circle cx={X(47)} cy={Y(65)} r={5.5 * k} fill={fur} />
          <circle cx={X(81)} cy={Y(65)} r={5.5 * k} fill={fur} />
          <circle cx={X(pose === 'lookaway' ? 49.5 : 47)} cy={Y(pose === 'lookaway' ? 64 : 66)} r={3 * k} fill={ink} />
          <circle cx={X(pose === 'lookaway' ? 83.5 : 81)} cy={Y(pose === 'lookaway' ? 64 : 66)} r={3 * k} fill={ink} />
        </>
      )}
      {pose === 'cool' && (
        <>
          <rect
            x={X(33)}
            y={Y(56)}
            width={26 * k}
            height={17 * k}
            rx={5 * k}
            fill={ink}
            stroke={fur}
            strokeWidth={2 * k}
          />
          <rect
            x={X(69)}
            y={Y(56)}
            width={26 * k}
            height={17 * k}
            rx={5 * k}
            fill={ink}
            stroke={fur}
            strokeWidth={2 * k}
          />
          <line x1={X(59)} y1={Y(63)} x2={X(69)} y2={Y(63)} stroke={fur} strokeWidth={2 * k} />
          <path d={`M${X(37)} ${Y(60)} L${X(45)} ${Y(60)}`} stroke={fur} strokeWidth={1.5 * k} opacity="0.6" />
          <path d={`M${X(73)} ${Y(60)} L${X(81)} ${Y(60)}`} stroke={fur} strokeWidth={1.5 * k} opacity="0.6" />
        </>
      )}
      {/* nose + mouth */}
      <ellipse cx={X(64)} cy={Y(80)} rx={6 * k} ry={4.2 * k} fill={ink} />
      <path
        d={
          pose === 'sad'
            ? `M${X(57)} ${Y(92)} Q${X(64)} ${Y(87)} ${X(71)} ${Y(92)}`
            : `M${X(57)} ${Y(88)} Q${X(64)} ${Y(93)} ${X(71)} ${Y(88)}`
        }
        stroke={ink}
        strokeWidth={3 * k}
        fill="none"
        strokeLinecap="round"
      />
      {!muted && (
        <>
          <circle cx={X(30)} cy={Y(80)} r={6 * k} fill={BLUSH} opacity="0.7" />
          <circle cx={X(98)} cy={Y(80)} r={6 * k} fill={BLUSH} opacity="0.7" />
        </>
      )}
      {coffee && (
        <>
          {/* mug held in both paws */}
          <path d="M78 100 h7 a7.3 7.3 0 0 1 0 14.6 h-7" fill="none" stroke={muted ? fur : CUP} strokeWidth="5" />
          <path
            d="M45 92.5 h34 l-3.4 27 h-27.2 z"
            fill={muted ? fur : CUP}
            stroke={muted ? ink : 'none'}
            strokeWidth="2"
          />
          {!muted && <path d="M66 92.5 h13 l-3.4 27 h-10.2 z" fill={CUP_SHADE} opacity="0.6" />}
          <ellipse cx="62" cy="92.5" rx="17" ry="4.6" fill={muted ? ink : COFFEE} />
          <circle cx="46" cy="108" r="8" fill={ink} />
          <circle cx="78" cy="108" r="8" fill={ink} />
          {!muted && (
            <>
              <path
                d="M54 86.5 c-4 -4 4 -7 0 -11 c-3 -4 3 -6 0 -10"
                stroke={STEAM}
                strokeWidth="3.2"
                fill="none"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M68 86.5 c-4 -4 4 -7 0 -11 c-3 -4 3 -6 0 -10"
                stroke={STEAM}
                strokeWidth="3.2"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              />
            </>
          )}
        </>
      )}
    </svg>
  );
}
