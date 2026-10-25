export type MissionStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type StopType = 'pickup' | 'delivery' | 'terminal' | 'other'

export interface MissionStop {
  id: string
  mission_id: string
  sequence_number: number
  stop_type: StopType | string
  address_snapshot: string
  planned_at?: string | null
  actual_at?: string | null
  instructions?: string | null
  location_label_snapshot?: string | null
  phone?: string | null
}

export interface Mission {
  id: string
  mission_number: string
  status: MissionStatus | string
  driver_id: string
  client_order_reference?: string | null
  planned_pickup_at?: string | null
  planned_end_at?: string | null
  actual_pickup_at?: string | null
  actual_delivery_at?: string | null
  origin_label_snapshot?: string | null
  destination_label_snapshot?: string | null
  pickup_address?: string | null
  delivery_address?: string | null
  container_number?: string | null
  container_type?: string | null
  container_length_ft?: number | null
  gross_weight_kg?: number | null
  seal_number?: string | null
  booking_reference?: string | null
  imdg_un_number?: string | null
  reefer_temperature?: string | null
  notes?: string | null
  stops: MissionStop[]
}

export interface DriverProfile {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  phone?: string | null
}

export interface MissionEvent {
  client_event_id: string
  mission_id: string
  event_type: 'status' | 'odometer' | 'fuel_ticket' | 'document'
  payload: Record<string, unknown>
  occurred_at: string
  synced: boolean
}

export interface OdometerReading {
  id: string
  mission_id: string
  reading_type: 'departure' | 'arrival'
  value_km: number
  photo_name?: string
  occurred_at: string
}

export interface FuelTicket {
  id: string
  mission_id: string
  liters?: number
  unit_price?: number
  total_amount?: number
  photo_name?: string
  verified: boolean
  occurred_at: string
}

export interface MissionMessage {
  id: string
  mission_id: string
  sender_role: 'driver' | 'dispatcher'
  sender_name: string
  body: string
  created_at: string
  read_at?: string | null
}
