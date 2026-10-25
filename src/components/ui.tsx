import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckCircle2, CloudOff, CloudUpload, Loader2 } from 'lucide-react'

export function ActionButton({ children, variant = 'primary', icon, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; icon?: ReactNode }) {
  const styles = {
    primary: 'bg-bassin text-white shadow-sm hover:bg-bassin-dark',
    secondary: 'border-2 border-bassin bg-white text-bassin hover:bg-slate-50',
    danger: 'bg-rose-700 text-white hover:bg-rose-800',
    ghost: 'bg-transparent text-bassin hover:bg-slate-100'
  }
  return <button className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{icon}{children}</button>
}

export function NetworkBadge({ online, pendingCount, syncing }: { online: boolean; pendingCount: number; syncing: boolean }) {
  return (
    <div className={`flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold ${online ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : online ? <CloudUpload className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      <span>{online ? 'En ligne' : 'Hors ligne'}</span>
      {pendingCount > 0 && <span className="rounded-full bg-white/80 px-2 py-0.5">{pendingCount}</span>}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { in_progress: 'bg-blue-100 text-blue-900', planned: 'bg-amber-100 text-amber-900', completed: 'bg-emerald-100 text-emerald-900', cancelled: 'bg-rose-100 text-rose-900', draft: 'bg-slate-100 text-slate-700' }
  const labels: Record<string, string> = { in_progress: 'En cours', planned: 'Planifiée', completed: 'Livrée', cancelled: 'Annulée', draft: 'Brouillon' }
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>{labels[status] ?? status}</span>
}

export function SavedMark() { return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Enregistré" /> }
