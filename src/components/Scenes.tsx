'use client';

/**
 * Themed SVG scenes that replace the old striped placeholder.
 * Each scene draws over a tone-coloured gradient background and uses
 * the per-tone palette from `TonePalette` so it always feels harmonious.
 *
 * Scenes are simple geometric silhouettes — temple, diya, thali, books —
 * intended to feel hand-cut from paper rather than a stock illustration.
 */

import React from 'react';
import { Tone, TonePalette } from '@/lib/tokens';

export type SceneKind =
  | 'mandal' | 'event' | 'job' | 'people' | 'panchang' | 'arti'
  | 'scholarship' | 'housing' | 'news' | 'group' | 'food' | 'study'
  | 'music' | 'dance' | 'ornament';

interface SceneProps {
  kind: SceneKind;
  tone?: Tone;
}

// Shared decorative background — soft dot lattice with corner paisley.
function Backdrop({ p, id }: { p: typeof TonePalette[Tone]; id: string }) {
  return (
    <>
      <defs>
        <pattern id={`dots-${id}`} patternUnits="userSpaceOnUse" width="14" height="14">
          <circle cx="2" cy="2" r="0.7" fill={p.dark} opacity="0.16"/>
        </pattern>
      </defs>
      <rect width="200" height="130" fill={`url(#dots-${id})`}/>
      {/* corner paisley flourishes */}
      <g fill={p.dark} opacity="0.10">
        <path d="M 6 6 q 14 -2 14 12 q 0 10 -10 10 q -8 0 -8 -8 q 0 -6 6 -6 q 4 0 4 4 q 0 2 -2 2"
              fill="none" stroke={p.dark} strokeWidth="1.2"/>
        <path d="M 194 124 q -14 2 -14 -12 q 0 -10 10 -10 q 8 0 8 8 q 0 6 -6 6 q -4 0 -4 -4 q 0 -2 2 -2"
              fill="none" stroke={p.dark} strokeWidth="1.2"/>
      </g>
    </>
  );
}

export default function Scene({ kind, tone = 'sand' }: SceneProps) {
  const p = TonePalette[tone];
  const id = `${kind}-${tone}`;

  return (
    <svg
      viewBox="0 0 200 130"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <Backdrop p={p} id={id}/>
      {(scenes[kind] ?? scenes.ornament)(p)}
    </svg>
  );
}

type Palette = typeof TonePalette[Tone];

// --- Individual scenes ----------------------------------------------------

const scenes: Record<SceneKind, (p: Palette) => React.ReactNode> = {
  // Temple / mandap silhouette with kalash on top
  mandal: (p) => (
    <g>
      {/* base */}
      <rect x="50" y="82" width="100" height="32" fill={p.dark}/>
      {/* steps */}
      <rect x="44" y="110" width="112" height="4" fill={p.dark}/>
      <rect x="40" y="114" width="120" height="3" fill={p.mid} opacity="0.85"/>
      {/* roof tiers */}
      <polygon points="50,82 100,46 150,82" fill={p.dark}/>
      <polygon points="62,68 100,46 138,68" fill={p.mid} opacity="0.9"/>
      {/* door */}
      <path d="M 92 114 v -22 a 8 8 0 0 1 16 0 v 22 z" fill={p.light}/>
      {/* kalash + flag */}
      <line x1="100" y1="46" x2="100" y2="28" stroke={p.dark} strokeWidth="1.6"/>
      <circle cx="100" cy="26" r="4" fill={p.dark}/>
      <path d="M 100 26 q 12 -2 10 -10 q -6 4 -10 10" fill={p.mid}/>
      {/* small windows */}
      <circle cx="74" cy="96" r="3" fill={p.light}/>
      <circle cx="126" cy="96" r="3" fill={p.light}/>
    </g>
  ),

  // Rangoli + diya for festive events
  event: (p) => (
    <g>
      {/* rangoli concentric */}
      <g transform="translate(100 70)" fill="none" stroke={p.dark} strokeWidth="1.4">
        <circle r="36"/>
        <circle r="26" opacity="0.6"/>
        <circle r="16" opacity="0.4"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <ellipse key={a} cx="0" cy="-26" rx="4" ry="9" fill={p.dark} opacity="0.7"
                   transform={`rotate(${a})`}/>
        ))}
      </g>
      {/* diya bottom-right */}
      <g transform="translate(150 96)">
        <path d="M -16 0 q 16 8 32 0 q -2 8 -16 8 q -14 0 -16 -8 z" fill={p.dark}/>
        <path d="M 16 -2 q 4 -10 -2 -16 q -2 8 2 16" fill={p.mid}/>
      </g>
    </g>
  ),

  // Briefcase + grid for jobs/work
  job: (p) => (
    <g>
      {/* grid lines */}
      <g stroke={p.dark} strokeWidth="0.8" opacity="0.18">
        <line x1="20" y1="40" x2="180" y2="40"/>
        <line x1="20" y1="60" x2="180" y2="60"/>
        <line x1="20" y1="80" x2="180" y2="80"/>
      </g>
      {/* briefcase */}
      <g transform="translate(100 70)">
        <rect x="-38" y="-18" width="76" height="48" rx="4" fill={p.dark}/>
        <rect x="-12" y="-26" width="24" height="10" rx="2" fill="none" stroke={p.dark} strokeWidth="2"/>
        <line x1="-38" y1="2" x2="38" y2="2" stroke={p.light} strokeWidth="1.4" opacity="0.7"/>
        <rect x="-6" y="-2" width="12" height="6" rx="1" fill={p.light}/>
      </g>
      {/* dots / opportunities */}
      <circle cx="36" cy="22" r="3" fill={p.mid}/>
      <circle cx="166" cy="22" r="3" fill={p.mid}/>
    </g>
  ),

  // Three connected figures (community)
  people: (p) => (
    <g transform="translate(100 70)">
      {[-46, 0, 46].map((x, i) => (
        <g key={i} transform={`translate(${x} 0)`}>
          <circle cx="0" cy="-12" r="10" fill={p.dark}/>
          <path d={`M -16 22 q 0 -16 16 -16 q 16 0 16 16 z`} fill={p.dark}/>
        </g>
      ))}
      {/* connection lines */}
      <line x1="-36" y1="-12" x2="-10" y2="-12" stroke={p.mid} strokeWidth="2" strokeDasharray="3 3"/>
      <line x1="10" y1="-12" x2="36" y2="-12" stroke={p.mid} strokeWidth="2" strokeDasharray="3 3"/>
    </g>
  ),

  // Sun + moon + stars (Marathi calendar / panchang)
  panchang: (p) => (
    <g>
      <circle cx="60" cy="60" r="24" fill="none" stroke={p.dark} strokeWidth="1.5"/>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => {
        const rad = (a * Math.PI) / 180;
        const r = (n: number) => Math.round(n * 100) / 100;
        return (
          <line key={a} x1="60" y1="60"
                x2={r(60 + Math.cos(rad) * 30)}
                y2={r(60 + Math.sin(rad) * 30)}
                stroke={p.dark} strokeWidth="1.2" opacity="0.5"/>
        );
      })}
      <circle cx="60" cy="60" r="10" fill={p.dark}/>
      {/* crescent moon */}
      <path d="M 150 56 a 16 16 0 1 1 -10 22 a 12 12 0 1 0 10 -22 z" fill={p.dark}/>
      {/* small stars */}
      {[[120, 30], [170, 36], [40, 24]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill={p.mid}/>
      ))}
    </g>
  ),

  // Diya / oil lamp with floating sparks (arti, devotional)
  arti: (p) => (
    <g transform="translate(100 78)">
      {/* lamp */}
      <path d="M -32 0 q 32 18 64 0 q -4 16 -32 16 q -28 0 -32 -16 z" fill={p.dark}/>
      <ellipse cx="0" cy="0" rx="32" ry="6" fill={p.mid} opacity="0.85"/>
      {/* wick + flame */}
      <line x1="0" y1="0" x2="0" y2="-6" stroke={p.dark} strokeWidth="1.5"/>
      <path d="M 0 -6 q -6 -8 0 -22 q 6 14 0 22 z" fill={p.mid}/>
      <path d="M 0 -10 q -3 -4 0 -12 q 3 8 0 12" fill={p.light}/>
      {/* sparks */}
      {[[-44, -22], [40, -16], [-30, -34], [50, -34], [0, -42]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M 0 -3 L 1 0 L 4 1 L 1 2 L 0 5 L -1 2 L -4 1 L -1 0 z" fill={p.dark} opacity="0.55"/>
        </g>
      ))}
    </g>
  ),

  // Graduation cap + scroll
  scholarship: (p) => (
    <g transform="translate(100 70)">
      {/* cap */}
      <polygon points="-40,-6 0,-22 40,-6 0,10" fill={p.dark}/>
      <path d="M -22 0 v 14 q 0 8 22 8 q 22 0 22 -8 v -14" fill="none" stroke={p.dark} strokeWidth="2"/>
      {/* tassel */}
      <line x1="0" y1="-22" x2="22" y2="-12" stroke={p.mid} strokeWidth="1.5"/>
      <circle cx="22" cy="-10" r="3" fill={p.mid}/>
      {/* scroll below */}
      <g transform="translate(0 36)">
        <rect x="-30" y="-4" width="60" height="10" rx="2" fill={p.light} stroke={p.dark} strokeWidth="1.2"/>
        <line x1="-22" y1="0" x2="22" y2="0" stroke={p.dark} strokeWidth="0.8" opacity="0.5"/>
      </g>
    </g>
  ),

  // House silhouette + path (housing / accommodation)
  housing: (p) => (
    <g>
      {/* path */}
      <path d="M 20 120 q 60 -10 80 -50 q 20 -40 80 -50" fill="none"
            stroke={p.dark} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.55"/>
      {/* house */}
      <g transform="translate(108 70)">
        <polygon points="-32,0 0,-26 32,0" fill={p.dark}/>
        <rect x="-28" y="0" width="56" height="34" fill={p.dark}/>
        <rect x="-8" y="10" width="16" height="24" fill={p.light}/>
        <rect x="14" y="10" width="10" height="10" fill={p.light}/>
        <rect x="-24" y="10" width="10" height="10" fill={p.light}/>
        {/* chimney */}
        <rect x="14" y="-22" width="6" height="10" fill={p.dark}/>
      </g>
    </g>
  ),

  // Newspaper / news
  news: (p) => (
    <g transform="translate(100 65)">
      <rect x="-44" y="-30" width="88" height="60" rx="2" fill={p.light} stroke={p.dark} strokeWidth="1.5"/>
      <rect x="-38" y="-24" width="40" height="22" fill={p.dark}/>
      {/* lines */}
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1="6" y1={-22 + i * 6} x2="38" y2={-22 + i * 6}
              stroke={p.dark} strokeWidth="1.2" opacity="0.7"/>
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1="-38" y1={4 + i * 5} x2="38" y2={4 + i * 5}
              stroke={p.dark} strokeWidth="1" opacity="0.55"/>
      ))}
    </g>
  ),

  // Speech bubbles (groups / chat)
  group: (p) => (
    <g>
      <g transform="translate(70 56)">
        <rect x="-26" y="-16" width="52" height="32" rx="8" fill={p.dark}/>
        <polygon points="-14,16 -8,16 -16,24" fill={p.dark}/>
        {[-10, 0, 10].map((x, i) => <circle key={i} cx={x} cy="0" r="2.5" fill={p.light}/>)}
      </g>
      <g transform="translate(135 86)">
        <rect x="-22" y="-12" width="44" height="26" rx="7" fill={p.mid}/>
        <polygon points="14,14 8,14 16,22" fill={p.mid}/>
        {[-8, 0, 8].map((x, i) => <circle key={i} cx={x} cy="0" r="2" fill={p.light}/>)}
      </g>
    </g>
  ),

  // Thali (concentric) — for food/festivals
  food: (p) => (
    <g transform="translate(100 70)">
      <circle r="44" fill={p.dark}/>
      <circle r="38" fill={p.mid}/>
      <circle r="32" fill={p.light}/>
      {/* katoris around the rim */}
      {[0, 60, 120, 180, 240, 300].map(a => {
        const rad = (a * Math.PI) / 180;
        const round = (n: number) => Math.round(n * 100) / 100;
        return (
          <circle key={a}
                  cx={round(Math.cos(rad) * 22)}
                  cy={round(Math.sin(rad) * 22)}
                  r="6" fill={p.dark}/>
        );
      })}
      <circle r="6" fill={p.mid}/>
    </g>
  ),

  // Open book (study, internship, scholarship secondary)
  study: (p) => (
    <g transform="translate(100 70)">
      <path d="M -50 -16 q 24 -8 50 0 q 26 -8 50 0 v 36 q -24 -8 -50 0 q -26 -8 -50 0 z" fill={p.dark}/>
      <path d="M 0 -16 v 36" stroke={p.light} strokeWidth="1.4"/>
      {[-1, 0, 1].map(i => (
        <line key={i} x1="-46" y1={-6 + i * 8} x2="-6" y2={-6 + i * 8}
              stroke={p.light} strokeWidth="1" opacity="0.7"/>
      ))}
      {[-1, 0, 1].map(i => (
        <line key={i} x1="6" y1={-6 + i * 8} x2="46" y2={-6 + i * 8}
              stroke={p.light} strokeWidth="1" opacity="0.7"/>
      ))}
    </g>
  ),

  // Tabla pair (music / culture)
  music: (p) => (
    <g transform="translate(100 80)">
      <ellipse cx="-26" cy="0" rx="22" ry="6" fill={p.dark}/>
      <rect x="-48" y="-22" width="44" height="22" fill={p.dark}/>
      <ellipse cx="-26" cy="-22" rx="22" ry="6" fill={p.mid}/>
      <circle cx="-26" cy="-22" r="8" fill={p.dark}/>

      <ellipse cx="28" cy="0" rx="18" ry="5" fill={p.dark}/>
      <rect x="10" y="-26" width="36" height="26" fill={p.dark}/>
      <ellipse cx="28" cy="-26" rx="18" ry="5" fill={p.mid}/>
      <circle cx="28" cy="-26" r="6" fill={p.dark}/>
    </g>
  ),

  // Dancer (Lavani / classical)
  dance: (p) => (
    <g transform="translate(100 64)" fill={p.dark}>
      {/* head */}
      <circle cx="0" cy="-30" r="7"/>
      {/* body curve */}
      <path d="M -2 -22 q -10 14 -2 26 q 10 -8 18 4 q 4 8 -4 18" fill="none" stroke={p.dark} strokeWidth="3" strokeLinecap="round"/>
      {/* arm raised */}
      <path d="M 0 -16 q -16 -14 -28 -8" fill="none" stroke={p.dark} strokeWidth="3" strokeLinecap="round"/>
      <path d="M 0 -14 q 18 -8 28 8" fill="none" stroke={p.dark} strokeWidth="3" strokeLinecap="round"/>
      {/* skirt flare */}
      <path d="M -10 14 q 10 6 24 0 q -2 12 -12 18 q -10 -6 -12 -18 z" fill={p.mid}/>
    </g>
  ),

  // Default — kalamkari / paisley flourish
  ornament: (p) => (
    <g fill="none" stroke={p.dark} strokeWidth="1.5">
      <g transform="translate(100 65)">
        <path d="M 0 -36 q 30 6 30 36 q 0 30 -30 30 q -30 0 -30 -30 q 0 -30 30 -36 z"/>
        <path d="M 0 -22 q 18 4 18 22 q 0 18 -18 18 q -18 0 -18 -18 q 0 -18 18 -22 z" opacity="0.8"/>
        <path d="M 0 -10 q 8 2 8 10 q 0 8 -8 8 q -8 0 -8 -8 q 0 -8 8 -10 z" fill={p.dark} opacity="0.55"/>
        <circle r="3" fill={p.dark}/>
      </g>
    </g>
  ),
};

// Map a free-text label to a sensible scene kind. Used as a fallback when
// a page hasn't passed an explicit `kind`.
const labelMap: Array<[RegExp, SceneKind]> = [
  [/mandal|temple|bhavan|gurudwara|hall|^MM|^BMM|^MML|^MVD|^MMS|^MMT/i, 'mandal'],
  [/event|festival|cultural|gudhi|rangoli|fest/i, 'event'],
  [/job|career|work|hiring|engineer|designer/i, 'job'],
  [/people|member|community|friend/i, 'people'],
  [/panchang|calendar|tithi/i, 'panchang'],
  [/arti|diya|aarti|prayer|lamp/i, 'arti'],
  [/scholarship|grad|university|college|bursary/i, 'scholarship'],
  [/housing|home|stay|accommodation/i, 'housing'],
  [/news|article|press/i, 'news'],
  [/group|chat|discussion|squad|charcha/i, 'group'],
  [/food|kitchen|cuisine|swayampaak|recipe/i, 'food'],
  [/study|book|literary|sahitya|library/i, 'study'],
  [/music|tabla|sangeet|tribute|joshi/i, 'music'],
  [/dance|lavani|bharatanatyam|kathak/i, 'dance'],
];

export function inferKind(label?: string | null): SceneKind {
  if (!label) return 'ornament';
  for (const [re, k] of labelMap) if (re.test(label)) return k;
  return 'ornament';
}
