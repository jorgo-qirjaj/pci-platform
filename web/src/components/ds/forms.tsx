import { useState, type ChangeEvent, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';

/* ============================================================
   Input — labelled text field.
   ============================================================ */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  mono?: boolean;
  wrapStyle?: CSSProperties;
}

export function Input({ label, hint, error, prefix, mono = false, id, wrapStyle = {}, ...rest }: InputProps) {
  const inputId = id || (label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: `1px solid ${error ? 'var(--red-600)' : focus ? 'var(--border-focus)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-card)',
          padding: '0 10px',
          boxShadow: focus ? 'var(--ring-focus)' : 'none',
          transition: 'box-shadow var(--dur-fast), border-color var(--dur-fast)',
        }}
      >
        {prefix && <span style={{ color: 'var(--text-tertiary)', display: 'inline-flex' }}>{prefix}</span>}
        <input
          id={inputId}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '9px 0',
            fontSize: 14,
            color: 'var(--text-primary)',
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          }}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 11, color: error ? 'var(--red-600)' : 'var(--text-tertiary)' }}>{error || hint}</span>
      )}
    </div>
  );
}

/* ============================================================
   Select — native dropdown styled to match Input.
   ============================================================ */

type Option = string | { value: string; label: string };

export interface SelectProps {
  label?: string;
  hint?: string;
  options?: Option[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  id?: string;
  style?: CSSProperties;
}

export function Select({ label, hint, options = [], value, onChange, id, style = {} }: SelectProps) {
  const selId = id || (label ? `sel-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && (
        <label htmlFor={selId} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex' }}>
        <select
          id={selId}
          value={value}
          onChange={onChange}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '100%',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-card)',
            padding: '9px 32px 9px 10px',
            fontSize: 14,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {options.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return (
              <option key={val} value={val}>
                {lab}
              </option>
            );
          })}
        </select>
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-tertiary)',
            fontSize: 12,
          }}
        >
          ▾
        </span>
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>}
    </div>
  );
}

/* ============================================================
   SearchField — compact search input with leading icon.
   ============================================================ */

export interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  width?: number;
  style?: CSSProperties;
}

export function SearchField({ placeholder = 'Search…', value, onChange, width = 220, style = {} }: SearchFieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        width,
        border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-card)',
        padding: '0 10px',
        boxShadow: focus ? 'var(--ring-focus)' : 'none',
        transition: 'box-shadow var(--dur-fast), border-color var(--dur-fast)',
        ...style,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: '7px 0',
          fontSize: 13,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          minWidth: 0,
        }}
      />
    </div>
  );
}
