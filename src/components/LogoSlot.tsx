export function LogoSlot({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'h-10' : 'h-16'}`}>
      {/* Le logo officiel CargoTraction */}
      <img 
        src="/logo-cargotraction.png" 
        alt="CargoTraction" 
        className={`${compact ? 'h-8' : 'h-12'} w-auto object-contain`} 
      />
      {!compact && (
        <span className="text-xl font-extrabold text-white tracking-wide">CargoTraction</span>
      )}
    </div>
  )
}
