// components/landing/hero-box.tsx
import { HERO } from './content';

/*
 * Isometric box, viewBox 0 0 400 440.
 * Opening (top rhombus): back (200,190) · right (320,250) · front (200,310) · left (80,250).
 * Walls are 110 tall, so the bottom corners are (80,360) · (200,420) · (320,360).
 */
const OPENING = 'M200 190 L320 250 L200 310 L80 250 Z';
const FRONT_LEFT = 'M80 250 L200 310 L200 420 L80 360 Z';
const FRONT_RIGHT = 'M200 310 L320 250 L320 360 L200 420 Z';
const BACK_LEFT = 'M80 250 L200 190 L200 300 L80 360 Z';
const BACK_RIGHT = 'M200 190 L320 250 L320 360 L200 300 Z';
const BEAM = 'M80 250 L320 250 L386 24 L14 24 Z';
// Lid: 14 units thick, resting exactly on the opening when untransformed.
const LID_TOP = 'M200 176 L320 236 L200 296 L80 236 Z';
const LID_LEFT = 'M80 236 L200 296 L200 310 L80 250 Z';
const LID_RIGHT = 'M200 296 L320 236 L320 250 L200 310 Z';

/** [x, delay in s] of the light particles rising out of the opening. */
const PIXELS: readonly [number, number][] = [
  [150, 2.0],
  [182, 3.1],
  [208, 2.5],
  [236, 3.8],
  [262, 2.8],
  [170, 4.4],
];

/** Where each emerging label floats, as % of the box container (inline-start based). */
const CHIP_POSITIONS = [
  { top: '46%', insetInlineStart: '2%', delay: 2.1, float: 0 },
  { top: '19%', insetInlineEnd: '0%', delay: 2.35, float: 1.4 },
  { top: '5%', insetInlineStart: '10%', delay: 2.6, float: 2.8 },
] as const;

export function HeroBox() {
  return (
    <div className="relative mx-auto aspect-[400/440] w-full max-w-[19rem] sm:max-w-[24rem] lg:max-w-[30rem]">
      {/* Ambient glow under the box (a gradient, not a blur filter, so it costs nothing per frame) */}
      <div
        aria-hidden
        className="tb-face absolute inset-x-[-20%] top-[22%] bottom-[-6%] rounded-full bg-[radial-gradient(closest-side,rgb(217_155_38/0.30),transparent)]"
      />
      {/* Contact shadow that grounds the navy box on the pearl page */}
      <div
        aria-hidden
        className="absolute inset-x-[12%] bottom-[-3%] h-[12%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(13_24_41/0.28),transparent)]"
      />

      <svg viewBox="0 0 400 440" className="relative h-full w-full overflow-visible" role="img" aria-labelledby="hero-box-title">
        <title id="hero-box-title">صندوق TechBox مفتوح ينطلق منه الضوء: فكرة تتحول إلى منتج ثم إلى شركة</title>
        <defs>
          <linearGradient id="tb-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f3d28b" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#d99b26" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#d99b26" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="tb-core" cx="50%" cy="55%" r="60%">
            <stop offset="0%" stopColor="#fff3d1" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#f3d28b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#d99b26" stopOpacity="0.15" />
          </radialGradient>
          <linearGradient id="tb-left" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#142944" />
            <stop offset="100%" stopColor="#0a1424" />
          </linearGradient>
          <linearGradient id="tb-right" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24497a" />
            <stop offset="100%" stopColor="#0f1e35" />
          </linearGradient>
          <linearGradient id="tb-lid-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3c63" />
            <stop offset="100%" stopColor="#0d1829" />
          </linearGradient>
        </defs>

        {/* Light escaping upward, drawn behind everything */}
        <g className="tb-glow">
          <path d={BEAM} fill="url(#tb-beam)" />
        </g>

        {/* Interior walls, mostly covered by the front faces */}
        <g className="tb-face">
          <path d={BACK_LEFT} fill="#07101d" />
          <path d={BACK_RIGHT} fill="#0a1628" />
        </g>
        <g className="tb-glow">
          <path d={OPENING} fill="url(#tb-core)" opacity="0.85" />
        </g>

        {/* Light particles */}
        <g aria-hidden>
          {PIXELS.map(([x, delay]) => (
            <rect
              key={x}
              className="tb-pixel"
              x={x}
              y={244}
              width="5"
              height="5"
              fill="#f3d28b"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </g>

        {/* Front faces */}
        <g className="tb-face">
          <path d={FRONT_LEFT} fill="url(#tb-left)" />
          <path d={FRONT_RIGHT} fill="url(#tb-right)" />
        </g>

        {/* Gold edges, drawn in on load */}
        <g fill="none" stroke="#d99b26" strokeWidth="1.6" strokeLinejoin="round">
          <path className="tb-line" pathLength={1} d={FRONT_LEFT} />
          <path className="tb-line" pathLength={1} d={FRONT_RIGHT} style={{ animationDelay: '0.15s' }} />
          <path className="tb-line" pathLength={1} d="M200 190 L200 300" strokeOpacity="0.45" style={{ animationDelay: '0.3s' }} />
          <path className="tb-line" pathLength={1} d={OPENING} stroke="#f3d28b" style={{ animationDelay: '0.3s' }} />
        </g>

        {/* Lid, lifted */}
        <g className="tb-lid">
          <path d={LID_LEFT} fill="#0d1829" />
          <path d={LID_RIGHT} fill="#1a3456" />
          <path d={LID_TOP} fill="url(#tb-lid-top)" />
          <g fill="none" stroke="#d99b26" strokeWidth="1.6" strokeLinejoin="round">
            <path d={LID_TOP} />
            <path d="M80 236 L80 250 L200 310 L320 250 L320 236 M200 296 L200 310" />
          </g>
        </g>
      </svg>

      {/* What comes out of the box: idea → MVP → startup */}
      <ul aria-hidden className="pointer-events-none absolute inset-0">
        {HERO.emerging.map((label, i) => {
          const { delay, float, ...position } = CHIP_POSITIONS[i];
          return (
            <li key={label} className="tb-chip absolute" style={{ ...position, animationDelay: `${delay}s` }}>
              <span
                className="tb-chip-float flex items-center gap-2 rounded-full border border-navy-900/10 bg-white/90 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-navy-900 shadow-[0_12px_30px_-10px_rgb(13_24_41/0.35)] sm:text-sm"
                style={{ animationDelay: `${float}s` }}
              >
                <span className="size-1.5 rounded-full bg-gold shadow-[0_0_10px_#d99b26]" />
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
