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
    
    // Appel de l'Edge Function
    const { data, error } = await supabase!.functions.invoke('driver-login', { body: { employee_code: employeeCode, pin } })
    if (error) throw error

    // CRUCIAL : On connecte la session Supabase avec les tokens reçus
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
    const { data, error } = await supabase!.from('missions').select('*, mission_stops(*)').order('planned_pickup_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((row) => ({ ...row, stops: row.mission_stops ?? [] })) as Mission[]
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
      p_occurred_at: event.occurred_at
    })
    if (error) throw error
  },

  async sendMessage(missionId: string, body: string): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase!.rpc('driver_send_message', { p_mission_id: missionId, p_body: body })
    if (error) throw error
  },

  // 👇 NOUVELLE FONCTION AJOUTÉE ICI 👇
  async changePin(oldPin: string, newPin: string): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase!.rpc('driver_change_pin', { 
      p_old_pin: oldPin, 
      p_new_pin: newPin 
    })
    if (error) throw error
  }
}