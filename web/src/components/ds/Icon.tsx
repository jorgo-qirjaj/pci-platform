import type { ComponentType } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  CircleAlert,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  LogOut,
  Microscope,
  PenLine,
  Plus,
  Printer,
  RotateCcw,
  RotateCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  type LucideProps,
} from 'lucide-react';

// Curated registry of the icons the platform uses, keyed by the kebab-case
// names that flow in from the design tokens / nav config. Explicit imports keep
// the bundle lean (importing lucide's full `icons` record pulls in everything).
const REGISTRY: Record<string, ComponentType<LucideProps>> = {
  'arrow-left': ArrowLeft,
  bell: Bell,
  'chevron-down': ChevronDown,
  'circle-alert': CircleAlert,
  clock: Clock,
  download: Download,
  'file-text': FileText,
  'folder-open': FolderOpen,
  gauge: Gauge,
  'layout-dashboard': LayoutDashboard,
  'log-out': LogOut,
  microscope: Microscope,
  'pen-line': PenLine,
  plus: Plus,
  printer: Printer,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  settings: Settings,
  'shield-alert': ShieldAlert,
  'trash-2': Trash2,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  upload: Upload,
  users: Users,
  x: X,
};

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** Lucide icon name in kebab-case, e.g. "layout-dashboard". */
  name: string;
  size?: number;
}

/** Thin wrapper over lucide-react that resolves kebab-case names (matching the design tokens). */
export function Icon({ name, size = 16, ...rest }: IconProps) {
  const Cmp = REGISTRY[name];
  if (!Cmp) {
    if (import.meta.env.DEV) console.warn(`[Icon] unknown icon "${name}"`);
    return null;
  }
  return <Cmp size={size} {...rest} />;
}
