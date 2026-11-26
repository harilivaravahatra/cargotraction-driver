export function LogoSlot({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'h-10' : 'h-16'}`}>
      <img 
        src="/sotrial-icon-192.png" 
        alt="SOTRIAL" 
        className={`${compact ? 'h-8' : 'h-12'} w-auto object-contain rounded-md`} 
      />
      {!compact && (
        <span className="text-xl font-extrabold text-white tracking-wide">SOTRIAL</span>
      )}
    </div>
  )
}


