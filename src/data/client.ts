import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { demoDriver, demoMessages, demoMissions } from './demo'
import type { DriverProfile, Mission, MissionEvent, MissionMessage } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || !supabaseUrl || !supabaseKey
export const supabase: SupabaseClient | null = !isDemoMode ? createClient(supabaseUrl!, supabaseKey!) : null

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const dataClient = {
  async login(employeeCode: string, pin: string): Promise<{ driver: DriverProfile; demo: boolean }> {
    if (isDemoMode) return { driver: clone(demoDriver), demo: true }
    const { data, error } = await supabase!.functions.invoke('driver-login', { body: { employee_code: employeeCode, pin } })
    if (error) throw error
    if (data?.session) {
      await supabase!.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    }
    return { driver: data.driver as DriverProfile, demo: false }
  },

  async getMissions(): Promise<Mission[]> {
    if (isDemoMode) return clone(demoMissions)
    
    // 1. On récupère les missions avec leurs étapes
    const { data: missionsData, error: missionsError } = await supabase!
      .from('missions')
      .select('*, mission_stops(*)')
      .order('planned_pickup_at', { ascending: true })
    
    if (missionsError) throw missionsError

    // 2. On récupère TOUS les terminaux pour avoir leurs codes
    const { data: terminalsData, error: terminalsError } = await supabase!
      .from('container_terminals')
      .select('id, terminal_code')
    
    if (terminalsError) throw terminalsError

    // 3. On crée un dictionnaire pour retrouver le code à partir de l'ID du terminal
    const terminalsMap = new Map(
      (terminalsData ?? []).map(t => [t.id, t.terminal_code])
    )

    // 4. On assemble le tout
    return (missionsData ?? []).map((row: any) => {
      const stops = (row.mission_stops ?? []).map((stop: any) => ({
        ...stop,
        // Si l'étape a un terminal_id, on va chercher son code. Sinon undefined.
        terminal_code: stop.terminal_id ? terminalsMap.get(stop.terminal_id) : undefined
      }))
      return { ...row, stops } as Mission
    })
  },

  async getMessages(): Promise<MissionMessage[]> {
    if (isDemoMode) return clone(demoMessages)
    const { data, error } = await supabase!.from('mission_messages').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as MissionMessage[]
  },

  async submitEvent(event: MissionEvent): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase!.rpc('driver_record_mission_event', {
      p_client_event_id: event.client_event_id,
      p_mission_id: event.mission_id,
      p_event_type: event.event_type,
      p_payload: event.payload,
      p_occurred_at: event.occurred_at,
      p_tractor_id: (event as any).tractor_id || null 
    })
    if (error) throw error
  },

  async sendMessage(missionId: string, body: string, messageType: string = 'other'): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase!.rpc('driver_send_message', { 
      p_mission_id: missionId, 
      p_body: body,
      p_message_type: messageType 
    })
    if (error) throw error
  },

  async getEvents(missionId: string): Promise<any[]> {
    if (isDemoMode) return []
    const { data, error } = await supabase!.from('driver_mission_events')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async changePin(oldPin: string, newPin: string): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase!.rpc('driver_change_pin', { p_old_pin: oldPin, p_new_pin: newPin })
    if (error) throw error
  },

  async uploadDocument(missionId: string, file: File, documentType: string): Promise<void> {
    if (isDemoMode) return
    const fileExt = file.name.split('.').pop()
    const fileName = `missions/${missionId}/${crypto.randomUUID()}.${fileExt}
    
    // 1. Upload dans le Storage
    const { error: storageError } = await supabase!.storage.from('mission-documents').upload(fileName, file)
    if (storageError) {
      console.error("ERREUR STORAGE :", storageError)
      throw storageError
    }

    // 2. Insertion en base via la RPC sécurisée (contourne le RLS)
    const { error: dbError } = await supabase!.rpc('driver_insert_mission_document', {
      p_mission_id: missionId,
      p_document_type: documentType,
      p_storage_path: fileName,
      p_original_filename: file.name,
      p_file_extension: fileExt,
      p_mime_type: file.type,
      p_size_bytes: file.size
    })
    
    if (dbError) {
      console.error("ERREUR BDD :", dbError)
      throw dbError
    }
  },


  // 🔥 NOUVELLE FONCTION : Upload Ticket Carburant
  async uploadFuelTicket(file: File, odometerKm: number): Promise<void> {
    if (isDemoMode) return
    const fileExt = file.name.split('.').pop()
    const fileName = `fuel/${crypto.randomUUID()}.${fileExt}`
    
    // 1. Upload image
    const { error: storageError } = await supabase!.storage.from('mission-documents').upload(fileName, file)
    if (storageError) throw storageError

    // 2. Insertion dans fuel_tickets
    const { error: dbError } = await supabase!.from('fuel_tickets').insert({
      photo_path: fileName,
      odometer_km: odometerKm,
      driver_id: (await supabase!.auth.getUser()).data.user?.id
    })
    if (dbError) throw dbError
  }
}