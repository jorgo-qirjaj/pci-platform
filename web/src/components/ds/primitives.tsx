import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

/* ============================================================
   Button — primary action element.
   Variants map to the brand: action blue (primary), AI teal (ai),
   outline (secondary), text (ghost), red (danger).
   ============================================================ */

type ButtonVariant = 'primary' | 'ai' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  style?: CSSProperties;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  full = false,
  disabled = false,
  children,
  style = {},
  ...rest
}: ButtonProps) {
  const sizes: Record<ButtonSize, CSSProperties & { height: number }> = {
    sm: { padding: '5px 12px', fontSize: 13, height: 30, gap: 6 },
    md: { padding: '8px 16px', fontSize: 14, height: 38, gap: 8 },
    lg: { padding: '11px 22px', fontSize: 15, height: 46, gap: 8 },
  };
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: 'var(--action)', color: '#fff', border: '1px solid var(--action)' },
    ai: { background: 'var(--ai)', color: '#fff', border: '1px solid var(--ai)' },
    secondary: { background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--text-link)', border: '1px solid transparent' },
    danger: { background: 'transparent', color: 'var(--red-600)', border: '1px solid var(--red-600)' },
  };
  const s = sizes[size];
  const v = variants[variant];
  const hoverBg: Record<ButtonVariant, string> = {
    primary: 'var(--action-hover)',
    ai: 'var(--ai-hover)',
    secondary: 'var(--surface-hover)',
    ghost: 'var(--surface-hover)',
    danger: 'var(--red-100)',
  };

  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        minHeight: s.height,
        fontFamily: 'var(--font-sans)',
        fontSize: s.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--dur-fast), filter var(--dur-fast), box-shadow var(--dur-fast)',
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = hoverBg[variant];
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = (v.background as string) ?? 'transparent';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.filter = 'none';
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.filter = 'none';
      }}
      {...rest}
    >
      {iconLeft && <span style={{ display: 'inline-flex', fontSize: '1.1em' }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex', fontSize: '1.1em' }}>{iconRight}</span>}
    </button>
  );
}

/* ============================================================
   IconButton — square, icon-only control for toolbars.
   ============================================================ */

type IconButtonSize = 'sm' | 'md' | 'lg';
type IconButtonVariant = 'ghost' | 'outline' | 'solid';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  active?: boolean;
  label?: string;
  style?: CSSProperties;
}

export function IconButton({
  size = 'md',
  variant = 'ghost',
  active = false,
  label,
  children,
  style = {},
  ...rest
}: IconButtonProps) {
  const dim = { sm: 28, md: 34, lg: 40 }[size];
  const variants: Record<IconButtonVariant, CSSProperties> = {
    ghost: {
      background: active ? 'var(--action-soft)' : 'transparent',
      color: active ? 'var(--action)' : 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    outline: { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' },
    solid: { background: 'var(--action)', color: '#fff', border: '1px solid var(--action)' },
  };
  const v = variants[variant];
  return (
    <button
      aria-label={label}
      title={label}
      style={{
        width: dim,
        height: dim,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background var(--dur-fast)',
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === 'ghost' && !active) e.currentTarget.style.background = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (variant === 'ghost' && !active) e.currentTarget.style.background = 'transparent';
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ============================================================
   Avatar — initials chip for users.
   ============================================================ */

export interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'navy' | 'blue' | 'teal';
  style?: CSSProperties;
}

export function Avatar({ name = '', size = 'md', tone = 'navy', style = {} }: AvatarProps) {
  const dim = { sm: 26, md: 32, lg: 40 }[size];
  const fs = { sm: 10, md: 12, lg: 14 }[size];
  const tones = {
    navy: { background: 'var(--navy-800)', color: '#fff' },
    blue: { background: 'var(--blue-600)', color: '#fff' },
    teal: { background: 'var(--teal-600)', color: '#fff' },
  };
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        ...tones[tone],
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

/* ============================================================
   Badge — small status/label pill. Tone-driven soft bg/fg pairs.
   ============================================================ */

type BadgeTone = 'neutral' | 'active' | 'review' | 'done' | 'ai' | 'critical';

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

export function Badge({ tone = 'neutral', dot = false, children, style = {} }: BadgeProps) {
  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: 'var(--status-neutral-bg)', fg: 'var(--status-neutral-fg)' },
    active: { bg: 'var(--status-active-bg)', fg: 'var(--status-active-fg)' },
    review: { bg: 'var(--status-review-bg)', fg: 'var(--status-review-fg)' },
    done: { bg: 'var(--status-done-bg)', fg: 'var(--status-done-fg)' },
    ai: { bg: 'var(--status-ai-bg)', fg: 'var(--status-ai-fg)' },
    critical: { bg: 'var(--status-critical-bg)', fg: 'var(--status-critical-fg)' },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: dot ? '3px 9px 3px 8px' : '3px 9px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        background: t.bg,
        color: t.fg,
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}

/* ============================================================
   Card — base surface container.
   ============================================================ */

export interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ padding = 'md', interactive = false, children, style = {}, onClick }: CardProps) {
  const pad = { none: 0, sm: 12, md: 16, lg: 24 }[padding];
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: pad,
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow var(--dur-base), border-color var(--dur-base)',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }
      }}
    >
      {children}
    </div>
  );
}
