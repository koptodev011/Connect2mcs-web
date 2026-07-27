export const C = {
  bg:         '#FAF6EC',
  bgDeep:     '#F2EBD8',
  surface:    '#FFFFFF',
  surfaceAlt: '#FFFBF1',
  ink:        '#0F0E0C',
  ink2:       '#3A342B',
  ink3:       '#6B6256',
  ink4:       '#A39A8A',
  line:       'rgba(15,14,12,0.08)',
  lineMid:    'rgba(15,14,12,0.14)',

  saffron:    '#E26A1F',
  saffronDk:  '#B84F12',
  saffronLt:  '#FFE9D6',
  brick:      '#A8321F',
  green:      '#1F7A3A',
  greenLt:    '#E1F2E6',
  blue:       '#1F4DA8',
  gold:       '#B8893C',
};

export const F = {
  ui:      'var(--font-ui), "Poppins", -apple-system, system-ui, sans-serif',
  display: 'var(--font-display), "Space Grotesk", "Poppins", -apple-system, sans-serif',
  deva:    'var(--font-deva), "Tiro Devanagari Marathi", serif',
  // legacy aliases (kept for backwards-compat with existing inline usages)
  serif:   'var(--font-display), "Space Grotesk", "Poppins", sans-serif',
  mono:    'var(--font-display), "Space Grotesk", ui-monospace, monospace',
};

export type Tone = 'saffron' | 'brick' | 'green' | 'blue' | 'gold' | 'pink' | 'sand' | 'ink';

// Per-tone scene palette used by themed illustrations
export const TonePalette: Record<Tone, { dark: string; mid: string; light: string; bgA: string; bgB: string }> = {
  saffron: { dark: '#8C3D0E', mid: '#C25216', light: '#FFE9D6', bgA: '#FFE2C2', bgB: '#F2B57A' },
  brick:   { dark: '#6F1E11', mid: '#A8321F', light: '#FAE0DA', bgA: '#EFC2B6', bgB: '#C97D6D' },
  green:   { dark: '#13502A', mid: '#1F7A3A', light: '#E1F2E6', bgA: '#CDE2C5', bgB: '#9DBE8A' },
  blue:    { dark: '#142F6E', mid: '#1F4DA8', light: '#DCE5F4', bgA: '#C4D1E6', bgB: '#8FA3CC' },
  gold:    { dark: '#7A5A1F', mid: '#B8893C', light: '#F4E8CC', bgA: '#ECD9A8', bgB: '#C9A85E' },
  pink:    { dark: '#7A2942', mid: '#C25275', light: '#F2C9D3', bgA: '#F2C9D3', bgB: '#D69BAA' },
  sand:    { dark: '#5E5028', mid: '#8E7B3F', light: '#EDE3C8', bgA: '#E8DCC0', bgB: '#C9B98A' },
  ink:     { dark: '#1A1714', mid: '#3A342B', light: '#A39A8A', bgA: '#5A5044', bgB: '#2D2620' },
};
