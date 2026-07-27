'use client';

import React, { CSSProperties, useState, useEffect } from 'react';
import Link from 'next/link';
import { C, F, Tone } from '@/lib/tokens';
import Icon from './Icon';
import Scene, { SceneKind, inferKind } from './Scenes';

// ── Button ──
type BtnKind = 'primary' | 'dark' | 'outline' | 'soft' | 'ghost' | 'subtle';
type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps {
  children?: React.ReactNode;
  kind?: BtnKind;
  size?: BtnSize;
  icon?: string;
  iconL?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  className?: string;
  full?: boolean;
  disabled?: boolean;
}

export function Btn({ children, kind = 'primary', size = 'md', icon, iconL, onClick, style = {}, className, full, disabled }: BtnProps) {
  const globalToast = useGlobalToast();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (onClick) {
      onClick(e);
    } else {
      globalToast.add(`Action completed!`, 'success');
    }
  };

  const sizes = {
    sm: { p: '7px 12px', fs: 12.5, h: 32 },
    md: { p: '9px 16px', fs: 13.5, h: 38 },
    lg: { p: '12px 22px', fs: 14.5, h: 46 },
  }[size];
  const kinds: Record<BtnKind, CSSProperties> = {
    primary: { background: C.saffron, color: '#fff',        border: `1px solid ${C.saffron}` },
    dark:    { background: C.ink,     color: '#fff',        border: `1px solid ${C.ink}` },
    outline: { background: '#fff',    color: C.ink,         border: `1.5px solid ${C.ink}` },
    soft:    { background: C.saffronLt, color: C.saffronDk, border: `1px solid ${C.saffronLt}` },
    ghost:   { background: 'transparent', color: C.ink,     border: `1px solid ${C.lineMid}` },
    subtle:  { background: '#fff',    color: C.ink,         border: `1px solid ${C.lineMid}` },
  };
  const cls = ['btn-int', className].filter(Boolean).join(' ');
  return (
    <button onClick={handleClick} disabled={disabled} className={cls} style={{
      ...kinds[kind],
      padding: sizes.p,
      height: sizes.h,
      fontSize: sizes.fs,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      borderRadius: 10,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      lineHeight: 1,
      justifyContent: 'center',
      width: full ? '100%' : undefined,
      letterSpacing: '-0.005em',
      fontFamily: F.ui,
      ...style,
    }}>
      {iconL && <Icon name={iconL as Parameters<typeof Icon>[0]['name']} size={size === 'lg' ? 18 : 16}/>}
      {children}
      {icon && <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={size === 'lg' ? 18 : 16}/>}
    </button>
  );
}

// ── Card ──
interface CardProps {
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
  pad?: number;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ children, style = {}, className, pad = 18, interactive, onClick }: CardProps) {
  const baseClass = interactive || onClick ? 'card-int' : '';
  const cls = [baseClass, className].filter(Boolean).join(' ') || undefined;
  return (
    <div
      onClick={onClick}
      className={cls}
      style={{
        background: C.surface,
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        padding: pad,
        boxShadow: '0 1px 2px rgba(15,14,12,0.04)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}>{children}</div>
  );
}

// ── Pill ──
interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: string;
  style?: CSSProperties;
  className?: string;
}

export function Pill({ children, active, onClick, icon, style = {}, className }: PillProps) {
  const baseClass = active ? '' : 'btn-int';
  const cls = [baseClass, className].filter(Boolean).join(' ') || undefined;
  return (
    <button onClick={onClick} className={cls} style={{
      padding: '8px 16px',
      borderRadius: 999,
      background: active ? C.ink : C.surface,
      color: active ? '#fff' : C.ink2,
      border: `1px solid ${active ? C.ink : C.lineMid}`,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.005em',
      lineHeight: 1,
      fontFamily: F.ui,
      ...style,
    }}>
      {icon && <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14}/>}
      {children}
    </button>
  );
}

// ── Tag ──
interface TagProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
  className?: string;
}

export function Tag({ children, color = C.ink2, bg = C.bgDeep, style = {}, className }: TagProps) {
  return (
    <span className={className} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 4,
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: bg,
      color,
      lineHeight: 1.2,
      ...style,
    }}>{children}</span>
  );
}

// ── Avatar ──
const _palette = ['#E08F4D','#3D7A4F','#A33B2A','#456EB8','#8E5A2A','#6B4E8B','#2C7A87'];

interface AvatarProps {
  name?: string;
  size?: number;
  src?: string;
  style?: CSSProperties;
}

export function Avatar({ name = 'M', size = 36, src, style = {} }: AvatarProps) {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % _palette.length;
  const init = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: src ? `center/cover url(${src}) ${_palette[i]}` : _palette[i],
      color: '#fff',
      fontWeight: 700,
      fontSize: size * 0.4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      letterSpacing: '-0.02em',
      ...style,
    }}>{!src && init}</div>
  );
}

// ── ImgPh ──
// Themed image card. Renders a real photo (when `src` is supplied) on top of
// a culturally relevant SVG scene; if no photo is given or it fails to load,
// the deterministic on-brand SVG scene shows. `kind` selects the scene.
interface ImgPhProps {
  label?: string;
  height?: number | string;
  tone?: Tone;
  style?: CSSProperties;
  badge?: string | null;
  children?: React.ReactNode;
  kind?: SceneKind;
  /** Show the small uppercase code label (e.g. "BMM", "EVENT"). Default false. */
  showLabel?: boolean;
  /** Real image URL (base64 data URI or path). When absent, only the SVG scene renders. */
  src?: string;
  /** @deprecated no-op; kept for call-site compatibility. */
  query?: string;
  /** @deprecated no-op; kept for call-site compatibility. */
  seed?: string | number;
  /** @deprecated no-op; the scene is always the default now. */
  noPhoto?: boolean;
}

const toneMap: Record<Tone, [string, string]> = {
  saffron: ['#FFE2C2', '#F2B57A'],
  brick:   ['#EFC2B6', '#C97D6D'],
  green:   ['#CDE2C5', '#9DBE8A'],
  blue:    ['#C4D1E6', '#8FA3CC'],
  gold:    ['#ECD9A8', '#C9A85E'],
  pink:    ['#F2C9D3', '#D69BAA'],
  sand:    ['#EDE3C8', '#C9B98A'],
  ink:     ['#5A5044', '#2D2620'],
};

export function ImgPh({
  label, height = 160, tone = 'saffron', style = {}, badge, children,
  kind, showLabel = false, src,
}: ImgPhProps) {
  const tones = toneMap[tone] ?? toneMap.sand;
  const sceneKind: SceneKind = kind ?? inferKind(label);
  const [imgError, setImgError] = useState(false);
  const showPhoto = !!src && !imgError;

  return (
    <div style={{
      height,
      position: 'relative',
      overflow: 'hidden',
      background: showPhoto ? '#fff' : `linear-gradient(135deg, ${tones[0]} 0%, ${tones[1]} 100%)`,
      ...style,
    }}>
      {/* Themed SVG sits behind the photo so it shows through if a real photo
          isn't supplied or fails to load. */}
      {!showPhoto && <Scene kind={sceneKind} tone={tone}/>}

      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
          }}
        />
      )}

      {/* Subtle bottom gradient so badges/labels stay readable on busy photos */}
      {showPhoto && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(15,14,12,0.05) 0%, rgba(15,14,12,0) 30%, rgba(15,14,12,0) 65%, rgba(15,14,12,0.22) 100%)',
        }}/>
      )}

      {showLabel && label && (
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em',
          color: showPhoto ? 'rgba(255,255,255,0.92)' : 'rgba(15,14,12,0.55)',
          textTransform: 'uppercase',
          fontFamily: F.display,
          textShadow: showPhoto ? '0 1px 3px rgba(0,0,0,0.45)' : undefined,
        }}>{label}</div>
      )}
      {badge && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: '#fff', color: C.ink, padding: '4px 9px',
          borderRadius: 6, fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}>{badge}</div>
      )}
      {children}
    </div>
  );
}

// ── PageHeader ──
// Standardised page title block. Use at the top of every route.
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  marathi?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, marathi, actions, eyebrow, className }: PageHeaderProps) {
  const cls = ['mob-flex-col mob-align-start', className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{
          margin: 0,
          fontFamily: F.display, fontSize: 34, fontWeight: 600,
          letterSpacing: '-0.03em', lineHeight: 1.1, color: C.ink,
          display: 'inline-flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
        }}>
          {title}
          {marathi && (
            <span style={{ fontFamily: F.deva, color: C.saffronDk, fontWeight: 400, fontSize: 28, letterSpacing: 0 }}>
              {marathi}
            </span>
          )}
        </h1>
        {subtitle && (
          <p style={{ margin: '6px 0 0', fontSize: 14, color: C.ink3, fontWeight: 500, lineHeight: 1.5, maxWidth: 720 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ── Stat ──
// Single number + label. Replaces ad-hoc fontWeight: 800 stat blocks.
interface StatProps {
  value: string | number;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  align?: 'left' | 'center';
}

export function Stat({ value, label, hint, icon, align = 'left' }: StatProps) {
  return (
    <div style={{ textAlign: align, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 4 }}>
      {icon && <div style={{ marginBottom: 4 }}>{icon}</div>}
      <div className="num" style={{ fontSize: 28, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.ink3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      {hint && <div style={{ fontSize: 11, color: C.ink4, fontWeight: 500 }}>{hint}</div>}
    </div>
  );
}

// ── SectionHead ──
interface SectionHeadProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  actionHref?: string;
  onAction?: () => void;
  accent?: string;
  className?: string;
}

export function SectionHead({ title, subtitle, action, actionHref, onAction, accent, className }: SectionHeadProps) {
  const cls = ['mob-flex-col mob-align-start', className].filter(Boolean).join(' ');
  const actionStyles: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: C.saffronDk, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
    textDecoration: 'none'
  };

  return (
    <div className={cls} style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 18, gap: 16,
    }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{
          margin: 0, fontSize: 24, fontWeight: 700, color: C.ink,
          letterSpacing: '-0.025em', lineHeight: 1.15,
          fontFamily: F.display,
        }}>
          {title}
          {accent && <span style={{ color: C.saffron, marginLeft: 8, fontFamily: F.deva, fontWeight: 400 }}>{accent}</span>}
        </h2>
        {subtitle && (
          <p style={{
            margin: '4px 0 0', fontSize: 13.5, color: C.ink3,
            fontWeight: 500, letterSpacing: '-0.005em',
          }}>{subtitle}</p>
        )}
      </div>
      {action && (
        actionHref ? (
          <Link href={actionHref} style={actionStyles}>{action} <Icon name="chevR" size={14}/></Link>
        ) : onAction ? (
          <span style={actionStyles} onClick={onAction}>{action} <Icon name="chevR" size={14}/></span>
        ) : (
          <span style={actionStyles}>{action} <Icon name="chevR" size={14}/></span>
        )
      )}
    </div>
  );
}

// ── Modal ──
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  marathi?: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ isOpen, onClose, title, marathi, children, width = 480 }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,12,0.45)', backdropFilter: 'blur(4px)' }}/>
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 20px 48px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{ padding: '20px 24px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 10 }}>
              {title}
              {marathi && <span style={{ fontFamily: F.deva, color: C.saffronDk, fontSize: 16, fontWeight: 400 }}>{marathi}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.bgDeep, border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chev" size={16} color={C.ink3}/>
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Toast ──
export type ToastType = 'success' | 'info' | 'error';
interface Toast {
  id: string;
  msg: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (msg: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  return { toasts, add };
}

// ── Global Toast Context ──
type ToastContextType = {
  add: (msg: string, type?: ToastType) => void;
};
const ToastContext = React.createContext<ToastContextType | null>(null);

export function GlobalToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, add } = useToast();
  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useGlobalToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) return { add: () => {} };
  return ctx;
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="mob-toast" style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? C.green : t.type === 'error' ? C.brick : C.ink,
          color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'toast-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}>
          <Icon name={t.type === 'success' ? 'verify' : 'bell'} size={16} color="#fff"/>
          {t.msg}
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Form Field ──
interface FieldProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  multiline?: boolean;
  deva?: boolean;
  placeholder?: string;
  type?: string;
  options?: { value: string; label: string }[];
}

export function Field({ label, value, defaultValue, onChange, multiline, deva, placeholder, type = 'text', options }: FieldProps) {
  const shared: CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10,
    fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: deva ? F.deva : 'inherit',
    lineHeight: 1.5, background: '#fff',
  };

  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {multiline ? (
        <textarea
          value={value}
          defaultValue={defaultValue}
          onChange={e => onChange?.(e.target.value)}
          rows={3}
          placeholder={placeholder}
          style={{ ...shared, resize: 'vertical' }}
        />
      ) : options ? (
        <select
          value={value}
          defaultValue={defaultValue}
          onChange={e => onChange?.(e.target.value)}
          style={shared}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          style={shared}
        />
      )}
    </label>
  );
}

// ── State Hook ──
export function useToggleSet<T>(initial?: T[]) {
  const [set, setSet] = useState<Set<T>>(new Set(initial));
  const toggle = (id: T) => setSet(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  return [set, toggle] as const;
}

// ── Rating ──
interface RatingProps {
  value: string | number;
  count?: string | number;
  size?: 'sm' | 'lg';
}

export function Rating({ value, count, size = 'sm' }: RatingProps) {
  const fs = size === 'lg' ? 12.5 : 11;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        background: C.green, color: '#fff', padding: '2px 5px', borderRadius: 4,
        fontSize: fs, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        <Icon name="star" size={fs - 1} color="#fff"/>{value}
      </span>
      {count && <span style={{ fontSize: fs, color: C.ink3, fontWeight: 500 }}>({count})</span>}
    </span>
  );
}
