export function LogoSlot({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'min-h-12'}`} aria-label="Emplacement du logo CargoTraction">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-white/50 bg-white/10 text-[10px] font-bold uppercase tracking-tight text-white">
        Logo
      </div>
      {!compact && <span className="text-base font-semibold tracking-tight text-white">CargoTraction</span>}
    </div>
  )
}
