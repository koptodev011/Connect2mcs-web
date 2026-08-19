'use client';

import React from 'react';
import { C } from '@/lib/tokens';

/**
 * A slim ornamental divider — paisley + dotted line — used between major
 * sections to add cultural rhythm and break the "card-after-card" cadence.
 */
interface DividerProps {
  label?: string;
  marathi?: string;
  align?: 'center' | 'left';
  style?: React.CSSProperties;
}

export function OrnamentDivider({ label, marathi, align = 'center', style }: DividerProps) {
  const Line = (
    <svg width="120" height="14" viewBox="0 0 120 14" aria-hidden="true">
      <line x1="0" y1="7" x2="46" y2="7" stroke={C.ink4} strokeWidth="1" strokeDasharray="2 4"/>
      <line x1="74" y1="7" x2="120" y2="7" stroke={C.ink4} strokeWidth="1" strokeDasharray="2 4"/>
      <g transform="translate(60 7)">
        <circle r="3.5" fill="none" stroke={C.saffron} strokeWidth="1.4"/>
        <circle r="1.2" fill={C.saffron}/>
      </g>
    </svg>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 14,
      padding: '6px 0',
      color: C.ink3,
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      ...style,
    }}>
      {Line}
      {label && <span>{label}</span>}
      {marathi && (
        <span style={{
          fontFamily: '"Tiro Devanagari Marathi", serif',
          fontSize: 16,
          letterSpacing: 0,
          textTransform: 'none',
          color: C.saffronDk,
          fontWeight: 400,
        }}>{marathi}</span>
      )}
      {Line}
    </div>
  );
}

/**
 * Small inline paisley used as a typographic accent.
 */
export function Paisley({ size = 14, color = C.saffron }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M 10 2 q 8 2 8 10 q 0 6 -6 6 q -6 0 -6 -6 q 0 -4 4 -4 q 2 0 2 2"
            fill="none" stroke={color} strokeWidth="1.3"/>
      <circle cx="10" cy="14" r="1.2" fill={color}/>
    </svg>
  );
}
