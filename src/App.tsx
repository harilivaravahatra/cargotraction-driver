import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft, Camera, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, CloudOff,
  FileText, Fuel, History, Home, Info, MapPin, Menu, MessageCircle, Navigation, Phone,
  Send, Smartphone, Truck, Upload, X, Key
} from 'lucide-react'
import { dataClient, isDemoMode } from './data/client'
import { demoDriver } from './data/demo'
import { listPendingEvents, makeClientEventId, queueEvent, removeEvent } from './lib/idb'
import type { DriverProfile, Mission, MissionEvent, MissionMessage } from './types'
import { LogoSlot } from './components/LogoSlot'
import { ActionButton, NetworkBadge, StatusPill } from './components/ui'
import { usePwaInstall } from './hooks/usePwaInstall'
import { hasInvalidContainerNumber, normalizeContainerNumber } from './lib/containerIso6346'

function formatContainerNumber(value?: string | null): string {
  const clean = (value || "").replace(/\s+/g, "").toUpperCase();
  if (clean.length <= 4) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  if (clean.length <= 10) return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 11)}`;
}

type Screen = 'home' | 'missions' | 'mission' | 'fuel' | 'messages' | 'settings'

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })

function formatDate(date?: string | null) {
  if (!date) return 'À confirmer'
  return `${dateFormatter.format(new Date(date))} · ${timeFormatter.format(new Date(date))}`
}

function mapUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function stopLabel(type: string) {
  if (type === 'pickup') return 'Prise en charge'
  if (type === 'delivery') return 'Livraison'
  if (type === 'terminal') return 'Terminal'
  if (type === 'port') return 'Terminal de sortie'
  if (type === 'return') return "Terminal d'entrée"
  if (type === 'depot') return 'POSIT'
  return 'Étape'
}

// 🔥 Composant Accordéon
function AccordionSection({ title, icon, children, defaultOpen = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <section className="mt-4 rounded-2xl bg-white shadow-card overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          {icon} {title}
        </h2>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </section>
  )
}

function LoginView({ onLogin }: { onLogin: (code: string, pin: string) => Promise<void> }) {
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { canInstall, promptInstall } = usePwaInstall()
  
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!code.trim() || !/^\d{4,6}$/.test(pin)) { setError('Saisissez un matricule et un PIN de 4 à 6 chiffres.'); return }
    setBusy(true); setError('')
    try { await onLogin(code.trim(), pin) } 
    catch { setError('Connexion impossible. Vérifiez vos identifiants ou votre réseau.') } 
    finally { setBusy(false) }
  }
  
  return (
    <main className="flex min-h-screen items-center justify-center bg-bassin px-5 py-8">
      <div className="w-full max-w-md">
        <LogoSlot />
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-bassin">Espace chauffeur</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Votre feuille de mission.</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Connectez-vous avec votre matricule et votre code personnel.</p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block"><span className="mb-2 block text-base font-bold text-slate-800">Matricule chauffeur</span><input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="username" placeholder="Ex. CT-042" className="min-h-14 w-full rounded-xl border-2 border-slate-200 px-4 text-lg uppercase outline-none focus:border-bassin" /></label>
            <label className="block"><span className="mb-2 block text-base font-bold text-slate-800">PIN (4 à 6 chiffres)</span><input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" type="password" autoComplete="one-time-code" placeholder="••••" className="min-h-14 w-full rounded-xl border-2 border-slate-200 px-4 text-2xl tracking-[0.35em] outline-none focus:border-bassin" /></label>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-base font-semibold text-rose-800">{error}</p>}
            <ActionButton type="submit" className="w-full" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</ActionButton>
            {canInstall && (
              <button type="button" onClick={promptInstall} className="w-full mt-2 rounded-xl border-2 border-bassin bg-white px-4 py-3 text-base font-bold text-bassin hover:bg-blue-50">
                📲 Installer l'application
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}

function Header({ driver, online, pendingCount, syncing, onHome, onMenu }: { driver: DriverProfile; online: boolean; pendingCount: number; syncing: boolean; onHome: () => void; onMenu: () => void }) {
  return <header className="safe-top sticky top-0 z-20 bg-bassin px-4 pb-3 text-white shadow-lg"><div className="mx-auto flex max-w-2xl items-center justify-between gap-3"><button onClick={onHome} className="rounded-xl p-1" aria-label="Accueil"><LogoSlot compact /></button><div className="flex items-center gap-2"><NetworkBadge online={online} pendingCount={pendingCount} syncing={syncing} /><button onClick={onMenu} className="rounded-xl p-3 hover:bg-white/10" aria-label="Menu"><Menu className="h-6 w-6" /></button></div></div><div className="mx-auto mt-2 flex max-w-2xl items-center gap-2 text-sm text-white/80"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 font-bold">{driver.first_name[0]}{driver.last_name[0]}</div><span>{driver.first_name} {driver.last_name} · {driver.employee_code}</span></div></header>
}

function PageTitle({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return <div className="mb-5 flex items-start gap-3">{onBack && <button onClick={onBack} className="mt-1 rounded-xl p-2 text-bassin hover:bg-slate-100" aria-label="Retour"><ArrowLeft className="h-6 w-6" /></button>}<div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>{subtitle && <p className="mt-1 text-base text-slate-600">{subtitle}</p>}</div></div>
}

function MissionCard({ mission, onOpen }: { mission: Mission; onOpen: () => void }) {
  const displayNumber = (mission as any).dossier_number || mission.mission_number;
  return <button onClick={onOpen} className="w-full rounded-2xl bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-bold text-bassin">{displayNumber}</p><h3 className="mt-1 text-lg font-extrabold text-slate-900">{mission.origin_label_snapshot ?? mission.pickup_address ?? 'Origine à confirmer'}</h3></div><StatusPill status={mission.status} /></div><div className="mt-4 flex items-center gap-3 text-slate-700"><div className="h-px flex-1 bg-slate-200" /><ChevronRight className="h-5 w-5 text-bassin" /><div className="h-px flex-1 bg-slate-200" /></div><p className="mt-3 text-base font-semibold text-slate-800">{mission.destination_label_snapshot ?? mission.delivery_address ?? 'Destination à confirmer'}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600"><span>{formatDate(mission.planned_pickup_at)}</span>{mission.container_number && <span className="font-mono font-bold">{mission.container_number}</span>}</div></button>
}

function HomeScreen({ missions, messages, onNavigate, onMission }: { missions: Mission[]; messages: MissionMessage[]; onNavigate: (screen: Screen) => void; onMission: (mission: Mission) => void }) {
  const active = missions.filter((m) => ['planned', 'in_progress'].includes(m.status))
  const unread = messages.filter((m) => !m.read_at && m.sender_role === 'dispatcher').length
  
  return <main className="space-y-6">
    <section className="rounded-2xl bg-gradient-to-br from-bassin to-bassin-dark px-5 py-3 text-white shadow-card">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Aujourd’hui</p>
    </section>

    <section className="grid gap-3" aria-label="Actions principales">
      <button onClick={() => onNavigate('missions')} className="flex min-h-20 items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-card"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800"><ClipboardList className="h-7 w-7" /></span><span className="flex-1"><span className="block text-lg font-extrabold text-slate-900">Mes missions</span><span className="block text-sm text-slate-600">{active.length} mission{active.length > 1 ? 's' : ''} à traiter</span></span><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-extrabold text-blue-900">{active.length}</span></button>
      <button onClick={() => onNavigate('fuel')} className="flex min-h-20 items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-card"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><Fuel className="h-7 w-7" /></span><span className="flex-1"><span className="block text-lg font-extrabold text-slate-900">Carburant</span><span className="block text-sm text-slate-600">Ticket & kilométrage</span></span><ChevronRight className="h-6 w-6 text-slate-400" /></button>
      <button onClick={() => onNavigate('messages')} className="flex min-h-20 items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-card"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800"><MessageCircle className="h-7 w-7" /></span><span className="flex-1"><span className="block text-lg font-extrabold text-slate-900">Messages</span><span className="block text-sm text-slate-600">Échangez avec le dispatch</span></span>{unread > 0 && <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-extrabold text-violet-900">{unread}</span>}</button>
    </section>
    
    {active[0] && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-900">Prochaine priorité</h2><button onClick={() => onNavigate('missions')} className="text-base font-bold text-bassin">Tout voir</button></div><MissionCard mission={active[0]} onOpen={() => onMission(active[0])} /></section>}
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"><Info className="mt-0.5 h-5 w-5 shrink-0 text-bassin" /><p>Le suivi est basé uniquement sur vos validations et vos documents.</p></div>
  </main>
}

function MissionsScreen({ missions, onOpen, onBack }: { missions: Mission[]; onOpen: (mission: Mission) => void; onBack: () => void }) {
  const active = missions.filter((m) => ['planned', 'in_progress'].includes(m.status))
  const history = missions.filter((m) => !['planned', 'in_progress'].includes(m.status))
  
  return <main>
    <PageTitle title="Mes missions" subtitle="La feuille de transport, en temps réel." onBack={onBack} />
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">À traiter</h2>
        <span className="text-sm font-bold text-slate-500">{active.length}</span>
      </div>
      {active.length ? active.map((mission) => <MissionCard key={mission.id} mission={mission} onOpen={() => onOpen(mission)} />) : <EmptyState text="Aucune mission en cours." />}
    </section>
    
    {/* 🔥 HISTORIQUE REPLIÉ */}
    <AccordionSection title="Historique récent" icon={<History className="h-5 w-5 text-bassin" />} defaultOpen={false}>
      <div className="space-y-3">
        {history.length ? history.map((mission) => <MissionCard key={mission.id} mission={mission} onOpen={() => onOpen(mission)} />) : <EmptyState text="Aucune mission dans l'historique." />}
      </div>
    </AccordionSection>
  </main>
}

function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center text-base text-slate-500">{text}</div> }

function MissionDetail({ mission, onBack, onEvent, onRefresh }: { mission: Mission; onBack: () => void; onEvent: (eventType: MissionEvent['event_type'], payload: Record<string, unknown>) => Promise<void>; onRefresh: () => void }) {
  const [km, setKm] = useState({ departure: '', arrival: '' })
  const [savedKm, setSavedKm] = useState({ departure: false, arrival: false }) // 🔥 Pour le bouton final
  const [hasCmr, setHasCmr] = useState(false) // 🔥 Pour le bouton final
  const [photoNotice, setPhotoNotice] = useState('')
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    dataClient.getEvents(mission.id).then(setEvents).catch(() => {})
  }, [mission.id])

  const hasEvent = (status: string) => events.some(e => e.event_type === 'status' && e.payload?.status === status)

  const saveStatus = async (status: string) => { 
    setEvents(prev => [...prev, { event_type: 'status', payload: { status } }])
    await onEvent('status', { status }); 
    onRefresh() 
  }
  
  const saveKm = async (kind: 'departure' | 'arrival') => { 
    const value = Number(km[kind]); 
    if (!value || value < 0) { setPhotoNotice('Saisissez une valeur kilométrique valide.'); return }; 
    await onEvent('odometer', { reading_type: kind, value_km: value }); 
    setSavedKm(prev => ({ ...prev, [kind]: true })) // 🔥 On marque comme enregistré
    setPhotoNotice('Relevé kilométrique enregistré.'); 
  }

  const onCmrPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => { 
    const file = event.target.files?.[0]; 
    if (!file) return; 
    try {
      await dataClient.uploadDocument(mission.id, file, 'cmr')
      setHasCmr(true) // 🔥 On marque le CMR comme uploadé
      setPhotoNotice(`CMR « ${file.name} » envoyé. En attente de validation par le bureau.`); 
    } catch (err) {
      setPhotoNotice('Erreur lors de l\'envoi du CMR.');
    }
  }

  const declareAvailable = async () => {
    await onEvent('status', { status: 'available' })
    setPhotoNotice('Mission terminée ! Vous êtes déclaré disponible pour une nouvelle mission.')
  }

  // 🔥 Condition pour activer le bouton du bas
  const canDeclareAvailable = hasEvent('in_progress') && hasEvent('arrived') && hasEvent('completed') && hasCmr && savedKm.departure && savedKm.arrival;

  const displayNumber = (mission as any).dossier_number || mission.mission_number;
  const clientRef = (mission as any).client_order_reference ? `Réf. client : ${(mission as any).client_order_reference}` : 'Ordre client non renseigné';

  const getContainers = () => {
    const list = [];
    const c1 = mission.container_number;
    const c2 = (mission as any).container_number_2;
    const cReturn = (mission as any).container_number_return;
    const sameReturn = (mission as any).same_return_container !== false;
    
    const formatType = (t?: string | null) => t ? t.replace('DV', 'DRY') : 'Type non renseigné';

    if (c1) list.push({ label: (c2 || (!sameReturn && cReturn)) ? 'Aller' : 'Conteneur', num: formatContainerNumber(c1), type: formatType(mission.container_type) });
    if (c2) list.push({ label: 'Aller 2', num: formatContainerNumber(c2), type: formatType((mission as any).container_type_2) });
    if (!sameReturn && cReturn) list.push({ label: 'Retour', num: formatContainerNumber(cReturn), type: formatType((mission as any).container_type_return) });
    return list;
  };
  const containers = getContainers();

  const isImport = (mission as any).direction_type === 'import';
  const opType = (mission as any).operation_type;
  const opLabel = opType === 'round_trip' ? 'Aller-Retour' : opType === 'one_way' ? 'Aller Simple' : 'Triangulaire';

  return <main className="pb-28">
    <PageTitle title={displayNumber} subtitle={`${clientRef} · ${formatDate(mission.planned_pickup_at)}`} onBack={onBack} />
    
    <div className="mb-4 flex gap-2">
      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${isImport ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>{isImport ? 'IMPORT' : 'EXPORT'}</span>
      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase text-slate-800">{opLabel}</span>
    </div>

    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Statut actuel</p><div className="mt-2"><StatusPill status={mission.status} /></div></div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
        <button 
          className={`min-h-12 rounded-lg px-2 text-sm font-bold transition-colors ${hasEvent('in_progress') ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
          onClick={() => saveStatus('in_progress')}
        >
          J'ai le conteneur
        </button>
        <button 
          className={`min-h-12 rounded-lg px-2 text-sm font-bold transition-colors ${hasEvent('arrived') ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
          onClick={() => saveStatus('arrived')}
        >
          {isImport ? 'Livré' : 'Récupéré'}
        </button>
        <button 
          className={`min-h-12 rounded-lg px-2 text-sm font-bold transition-colors ${hasEvent('completed') ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
          onClick={() => saveStatus('completed')}
        >
          Fini
        </button>
      </div>
    </section>

    {/* 🔥 ACCORDÉON OUVERT PAR DÉFAUT */}
    <AccordionSection title="Conteneur(s)" icon={<Truck className="h-5 w-5 text-bassin" />} defaultOpen={true}>
      <div className="space-y-3">
        {containers.length > 0 ? containers.map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">{c.label}</p>
              <p className="text-lg font-extrabold text-bassin tracking-wider">{c.num}</p>
              {(mission as any).loading_reference && <p className="text-xs font-semibold text-slate-600 mt-1">Réf. chargement : {(mission as any).loading_reference}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{c.type}</p>
            </div>
          </div>
        )) : (
          <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">Aucun numéro de conteneur renseigné. Contactez le dispatch.</p>
        )}
      </div>
    </AccordionSection>
    
    {/* 🔥 ACCORDÉON OUVERT PAR DÉFAUT */}
    <AccordionSection title="Étapes" icon={<Navigation className="h-5 w-5 text-bassin" />} defaultOpen={true}>
      <div className="space-y-5">
        {mission.stops.map((stop, index) => <div key={stop.id} className="relative pl-9">
          {index < mission.stops.length - 1 && <span className="absolute left-[11px] top-7 h-full w-0.5 bg-slate-200" />}
          <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-bassin text-xs font-bold text-white">{stop.sequence_number}</span>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-wide text-bassin">{stopLabel(stop.stop_type)}</p>
              
              {/* 🔥 CODE TERMINAL */}
              <p className="mt-1 text-base font-bold text-slate-900">
                {stop.terminal_code || stop.location_label_snapshot || stop.address_snapshot}
              </p>
              
              <p className="mt-1 text-sm leading-6 text-slate-600">{stop.address_snapshot}</p>
              {stop.planned_at && <p className="mt-2 text-sm font-semibold text-slate-600">Prévu : {formatDate(stop.planned_at)}</p>}
              {stop.instructions && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{stop.instructions}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              {stop.phone && <a href={`tel:${stop.phone}`} className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800" aria-label={`Appeler ${stop.phone}`}><Phone className="h-5 w-5" /></a>}
              <a href={mapUrl(stop.address_snapshot)} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800" aria-label="Ouvrir l’itinéraire"><MapPin className="h-5 w-5" /></a>
            </div>
          </div>
        </div>)}
      </div>
    </AccordionSection>

    {/* 🔥 ACCORDÉON REPLIÉ PAR DÉFAUT */}
    <AccordionSection title="Détails transport" icon={<Truck className="h-5 w-5 text-bassin" />} defaultOpen={false}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-base">
        <DataItem label="Poids brut" value={mission.gross_weight_kg ? `${mission.gross_weight_kg.toLocaleString('fr-FR')} kg` : 'Non renseigné'} />
        <DataItem label="Plomb" value={mission.seal_number ?? 'À contrôler'} />
        <DataItem label="Booking" value={mission.booking_reference ?? 'Non renseigné'} />
        <DataItem label="IMCO / ONU" value={mission.imdg_un_number ?? 'Non renseigné'} />
      </dl>
      {mission.notes && <p className="mt-5 border-t border-slate-100 pt-4 text-base leading-7 text-slate-700"><strong>Consignes :</strong> {mission.notes}</p>}
    </AccordionSection>

    {/* 🔥 ACCORDÉON OUVERT PAR DÉFAUT */}
    <AccordionSection title="Compteur kilométrique" icon={<span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-bassin text-[10px] font-black text-bassin">km</span>} defaultOpen={true}>
      <p className="text-sm leading-6 text-slate-600 mb-4">Saisissez la valeur relevée sur le tableau de bord.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['departure', 'arrival'] as const).map((kind) => (
          <div key={kind} className={`rounded-xl border p-4 ${savedKm[kind] ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
            <p className="font-bold text-slate-900">Kilométrage {kind === 'departure' ? 'départ' : 'arrivée'}</p>
            <input type="number" min="0" inputMode="numeric" placeholder="Ex: 125000" value={km[kind]} onChange={(e) => { setKm({ ...km, [kind]: e.target.value }); setSavedKm(prev => ({...prev, [kind]: false})) }} className="mt-3 min-h-12 w-full rounded-lg border-2 border-slate-200 px-3 text-base" />
            <ActionButton variant={savedKm[kind] ? 'primary' : 'secondary'} className={`mt-3 w-full text-sm ${savedKm[kind] ? 'bg-emerald-600 text-white' : ''}`} onClick={() => saveKm(kind)}>
              {savedKm[kind] ? 'Enregistré ✓' : 'Enregistrer'}
            </ActionButton>
          </div>
        ))}
      </div>
    </AccordionSection>

    {/* 🔥 CMR */}
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><FileText className="h-5 w-5 text-bassin" />CMR / Bon de livraison</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">Prenez en photo le CMR signé pour cette mission.</p>
      <label className={`mt-4 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-base font-bold ${hasCmr ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-bassin text-bassin'}`}>
        {hasCmr ? <CheckCircle2 className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        {hasCmr ? 'CMR envoyé ✓' : 'Photographier le CMR'}
        <input type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={onCmrPhoto} />
      </label>
    </section>

    {photoNotice && <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900"><Info className="mt-0.5 h-5 w-5 shrink-0" />{photoNotice}</div>}

    {/* 🔥 BOUTON FINAL DE DISPONIBILITÉ */}
    <section className="mt-6">
      <button 
        onClick={declareAvailable} 
        disabled={!canDeclareAvailable}
        className={`w-full rounded-2xl p-5 text-lg font-bold shadow-lg transition-all ${canDeclareAvailable ? 'bg-bassin text-white hover:bg-bassin-dark' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        Terminer la mission et déclarer ma disponibilité
      </button>
      {!canDeclareAvailable && (
        <p className="text-center text-xs text-slate-500 mt-2">
          (Complétez les 3 statuts, le CMR et les kilométrages pour activer)
        </p>
      )}
    </section>

  </main>
}

function DataItem({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value}</dd></div> }

// 🔥 NOUVEL ÉCRAN CARBURANT
function FuelScreen({ onBack, onEvent }: { onBack: () => void; onEvent: (eventType: MissionEvent['event_type'], payload: Record<string, unknown>) => Promise<void> }) {
  const [km, setKm] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const sendTicket = async () => {
    if (!km || !file) return
    setSending(true)
    try {
      await dataClient.uploadFuelTicket(file, Number(km))
      setNotice('Ticket carburant envoyé avec succès !')
      setKm('')
      setFile(null)
    } catch (err) {
      setNotice('Erreur lors de l\'envoi du ticket.')
    } finally {
      setSending(false)
    }
  }

  return <main>
    <PageTitle title="Ticket Carburant" subtitle="Saisissez le kilométrage et prenez la photo." onBack={onBack} />
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <label className="block mb-6">
        <span className="mb-2 block text-base font-bold text-slate-800">Kilométrage au compteur *</span>
        <input type="number" min="0" inputMode="numeric" placeholder="Ex: 125000" value={km} onChange={(e) => setKm(e.target.value)} className="min-h-14 w-full rounded-xl border-2 border-slate-200 px-4 text-2xl outline-none focus:border-bassin" />
      </label>

      <span className="mb-2 block text-base font-bold text-slate-800">Photo du ticket *</span>
      <label className={`flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-4 transition ${km ? 'border-bassin bg-blue-50 hover:bg-blue-100' : 'border-slate-300 bg-slate-100 opacity-50 cursor-not-allowed'}`}>
        <Camera className={`h-6 w-6 ${km ? 'text-bassin' : 'text-slate-400'}`} />
        <span className={`text-base font-bold ${km ? 'text-bassin' : 'text-slate-400'}`}>{file ? file.name : 'Prendre la photo'}</span>
        <input type="file" accept="image/*" capture="environment" disabled={!km} className="sr-only" onChange={handlePhoto} />
      </label>

      <ActionButton className="mt-6 w-full" onClick={sendTicket} disabled={!km || !file || sending}>
        {sending ? 'Envoi en cours...' : 'Envoyer le ticket'}
      </ActionButton>

      {notice && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-base font-semibold text-emerald-800">{notice}</div>}
    </section>
  </main>
}

function MessagesScreen({ messages, missions, onBack, onSend }: { messages: MissionMessage[]; missions: Mission[]; onBack: () => void; onSend: (missionId: string, body: string, type: string) => Promise<void> }) {
  const activeMissions = missions.filter(m => m.status === 'planned')
  const [missionId, setMissionId] = useState(activeMissions[0]?.id ?? '')
  const [messageType, setMessageType] = useState('container')
  const [body, setBody] = useState('')
  const visible = messages.filter((message) => message.mission_id === missionId)
  
  // 🔥 Vérification de la validité du conteneur
  const isInvalidContainer = messageType === 'container' && hasInvalidContainerNumber(body);
  
  const send = async () => { 
    if (!body.trim() || isInvalidContainer) return; 
    // Si c'est un conteneur, on le nettoie (enlève les espaces) avant l'envoi
    const finalBody = messageType === 'container' ? normalizeContainerNumber(body) : body.trim();
    await onSend(missionId, finalBody, messageType); 
    setBody('') 
  }
  
  return <main>
    <PageTitle title="Messages" subtitle="Un fil simple avec le dispatch." onBack={onBack} />
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <select value={missionId} onChange={(e) => setMissionId(e.target.value)} className="min-h-14 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-base mb-3">
        {activeMissions.map((mission) => {
          const displayNum = (mission as any).dossier_number || mission.mission_number;
          return <option key={mission.id} value={mission.id}>{displayNum}</option>
        })}
      </select>

      <select value={messageType} onChange={(e) => { setMessageType(e.target.value); setBody(''); }} className="min-h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm mb-4 font-semibold text-bassin">
        <option value="container">Numéro de conteneur</option>
        <option value="trailer">Numéro de remorque</option>
        <option value="other">Autre observation</option>
      </select>
      
      <div className="mt-4 space-y-3">
        {visible.length ? visible.map((message) => (
          <div key={message.id} className={`max-w-[90%] rounded-2xl p-4 ${message.sender_role === 'driver' ? 'ml-auto bg-bassin text-white' : 'bg-slate-100 text-slate-900'}`}>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{message.sender_name}</p>
            <p className="mt-1 text-base leading-6">{message.body}</p>
            <div className="mt-2 flex items-center justify-end gap-1 text-xs opacity-70">{formatDate(message.created_at)} {message.read_at && <CheckCircle2 className="h-3.5 w-3.5" />}</div>
          </div>
        )) : <EmptyState text="Pas encore de message pour cette mission." />}
      </div>
      
      <div className="mt-5 flex items-end gap-2 border-t border-slate-100 pt-4">
        <div className="flex-1">
          <textarea 
            value={body} 
            onChange={(e) => setBody(messageType === 'container' ? formatContainerNumber(e.target.value) : e.target.value)} 
            rows={2} 
            placeholder={messageType === 'container' ? "Ex: TGSU 252 257 7..." : "Saisissez votre message..."} 
            className={`min-h-14 w-full resize-none rounded-xl border-2 p-3 text-base ${isInvalidContainer ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} 
          />
          {isInvalidContainer && (
            <p className="mt-1 text-xs font-bold text-rose-600">
              Format de conteneur invalide (ISO 6346)
            </p>
          )}
        </div>
        <button onClick={send} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-bassin text-white disabled:opacity-50" disabled={!body.trim() || isInvalidContainer} aria-label="Envoyer">
          <Send className="h-6 w-6" />
        </button>
      </div>
    </section>
  </main>
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall()
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const changePin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPin || newPin.length < 4) { setMsg('Le nouveau PIN doit faire au moins 4 chiffres.'); return }
    setLoading(true); setMsg('')
    try {
      await dataClient.changePin(oldPin, newPin)
      setMsg('Code PIN modifié avec succès !')
      setOldPin(''); setNewPin('')
    } catch (err: any) {
      setMsg(err.message || 'Erreur lors du changement de code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <PageTitle title="Paramètres" onBack={onBack} />
      
      {!isInstalled && (
        <section className="rounded-2xl bg-white p-5 shadow-card mb-4 border border-bassin/20">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2"><Smartphone className="h-5 w-5 text-bassin" /> Application Mobile</h2>
          {isIOS ? (
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
              <p className="font-bold text-slate-800 mb-1">Installer sur iPhone :</p>
              <p>1. Appuyez sur l'icône <strong>Partager</strong> (en bas de Safari).</p>
              <p>2. Faites défiler et cliquez sur <strong>"Sur l'écran d'accueil"</strong>.</p>
            </div>
          ) : canInstall ? (
            <button onClick={promptInstall} className="w-full rounded-xl bg-bassin text-white font-bold py-3 px-4">📲 Installer CargoTraction</button>
          ) : (
            <p className="text-sm text-slate-500">Ouvrez ce site dans Chrome (Android) ou Safari (iPhone) pour l'installer.</p>
          )}
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-card mb-4">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2"><Key className="h-5 w-5 text-bassin" /> Sécurité du compte</h2>
        <form onSubmit={changePin} className="space-y-4">
          <label className="block"><span className="mb-2 block text-base font-bold text-slate-800">Ancien PIN</span><input type="password" inputMode="numeric" value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} className="min-h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-lg" /></label>
          <label className="block"><span className="mb-2 block text-base font-bold text-slate-800">Nouveau PIN (4 à 6 chiffres)</span><input type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="min-h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-lg" /></label>
          {msg && <p className={`text-sm font-bold ${msg.includes('succès') ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</p>}
          <ActionButton type="submit" disabled={loading} className="w-full">{loading ? 'Enregistrement…' : 'Changer mon code PIN'}</ActionButton>
        </form>
      </section>
    </main>
  )
}

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) { 
  return <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-3 pt-2 shadow-[0_-4px_14px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="mx-auto grid max-w-2xl grid-cols-4 gap-1">
      <NavItem active={screen === 'home'} icon={<Home />} label="Accueil" onClick={() => onNavigate('home')} />
      <NavItem active={screen === 'missions' || screen === 'mission'} icon={<ClipboardList />} label="Missions" onClick={() => onNavigate('missions')} />
      <NavItem active={screen === 'fuel'} icon={<Fuel />} label="Carburant" onClick={() => onNavigate('fuel')} />
      <NavItem active={screen === 'messages'} icon={<MessageCircle />} label="Messages" onClick={() => onNavigate('messages')} />
    </div>
  </nav> 
}
function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold ${active ? 'bg-blue-50 text-bassin' : 'text-slate-500'}`}>{<span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>}{label}</button> }

export function App() {
  const [driver, setDriver] = useState<DriverProfile | null>(isDemoMode ? demoDriver : null)
  const [screen, setScreen] = useState<Screen>('home')
  const [missions, setMissions] = useState<Mission[]>([])
  const [messages, setMessages] = useState<MissionMessage[]>([])
  const [selected, setSelected] = useState<Mission | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => { if (!driver) return; try { const [nextMissions, nextMessages] = await Promise.all([dataClient.getMissions(), dataClient.getMessages()]); setMissions(nextMissions); setMessages(nextMessages) } catch { setNotice('Les données ne sont pas disponibles. La file hors ligne reste active.') } }, [driver])
  const updatePending = useCallback(async () => { try { setPendingCount((await listPendingEvents()).length) } catch { setPendingCount(0) } }, [])
  const sync = useCallback(async () => { if (!online || syncing) return; setSyncing(true); try { const events = await listPendingEvents(); for (const event of events) { try { await dataClient.submitEvent(event); await removeEvent(event.client_event_id) } catch { break } } await updatePending(); if (events.length) setNotice(`${events.length} action${events.length > 1 ? 's' : ''} synchronisée${events.length > 1 ? 's' : ''}.`) } finally { setSyncing(false) } }, [online, syncing, updatePending])
  useEffect(() => { void refresh(); void updatePending() }, [refresh, updatePending])
  useEffect(() => { const on = () => setOnline(true); const off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) } }, [])
  useEffect(() => { if (online) void sync() }, [online, sync])

  const login = async (code: string, pin: string) => { const result = await dataClient.login(code, pin); setDriver(result.driver); setNotice(result.demo ? 'Mode démo actif.' : 'Connexion réussie.') }
  const addEvent = async (eventType: MissionEvent['event_type'], payload: Record<string, unknown>) => { 
    const missionId = selected?.id ?? String(payload.mission_id ?? ''); 
    if (!missionId) return; 
    
    const event: MissionEvent = { 
      client_event_id: makeClientEventId(), 
      mission_id: missionId, 
      event_type: eventType, 
      payload, 
      occurred_at: new Date().toISOString(), 
      synced: false,
      tractor_id: (selected as any)?.tractor_id 
    }; 
    
    await queueEvent(event); 
    await updatePending(); 
    if (online) { 
      try { 
        await dataClient.submitEvent(event); 
        await removeEvent(event.client_event_id); 
        await updatePending(); 
        setNotice('Action enregistrée et synchronisée.') 
      } catch { 
        setNotice('Action enregistrée hors ligne.') 
      } 
    } else {
      setNotice('Hors ligne : action enregistrée.')
    } 
  }


  const sendMessage = async (missionId: string, body: string, type: string) => { try { await dataClient.sendMessage(missionId, body, type); setMessages((current) => [...current, { id: makeClientEventId(), mission_id: missionId, sender_role: 'driver', sender_name: 'Vous', body, created_at: new Date().toISOString(), read_at: new Date().toISOString(), message_type: type }]); setNotice('Message envoyé.') } catch { setNotice('Message conservé localement.') } }
  
  if (!driver) return <LoginView onLogin={login} />
  
  const navigate = (next: Screen) => { setScreen(next); if (next !== 'mission') setSelected(null) }
  
  const content = screen === 'home' ? <HomeScreen missions={missions} messages={messages} onNavigate={navigate} onMission={(mission) => { setSelected(mission); setScreen('mission') }} /> 
    : screen === 'missions' ? <MissionsScreen missions={missions} onOpen={(mission) => { setSelected(mission); setScreen('mission') }} onBack={() => navigate('home')} /> 
    : screen === 'mission' && selected ? <MissionDetail mission={selected} onBack={() => navigate('missions')} onEvent={addEvent} onRefresh={refresh} /> 
    : screen === 'fuel' ? <FuelScreen onBack={() => navigate('home')} onEvent={addEvent} /> 
    : screen === 'settings' ? <SettingsScreen onBack={() => navigate('home')} />
    : <MessagesScreen messages={messages} missions={missions} onBack={() => navigate('home')} onSend={sendMessage} />

  return <div className="min-h-screen bg-slate-50"><Header driver={driver} online={online} pendingCount={pendingCount} syncing={syncing} onHome={() => navigate('home')} onMenu={() => navigate('settings')} /><div className="mx-auto max-w-2xl px-4 pb-28 pt-6">{content}</div><BottomNav screen={screen} onNavigate={navigate} />{notice && <div className="fixed bottom-24 left-4 right-4 z-30 mx-auto flex max-w-2xl items-start gap-3 rounded-2xl bg-slate-900 p-4 text-sm font-semibold leading-6 text-white shadow-2xl"><Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><span className="flex-1">{notice}</span><button onClick={() => setNotice('')} aria-label="Fermer"><X className="h-5 w-5" /></button></div>}</div>
}