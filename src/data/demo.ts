import type { DriverProfile, Mission, MissionMessage } from '../types'

export const demoDriver: DriverProfile = {
  id: 'demo-driver-001', employee_code: 'CT-042', first_name: 'Marc', last_name: 'Leroy', phone: '+33 6 12 34 56 78'
}

export const demoMissions: Mission[] = [
  {
    id: 'demo-mission-001', mission_number: 'CT-2026-1048', status: 'in_progress', driver_id: demoDriver.id,
    client_order_reference: 'MAERSK-54821', planned_pickup_at: '2026-10-25T07:30:00+02:00', planned_end_at: '2026-10-25T16:30:00+02:00',
    origin_label_snapshot: 'Terminal du Grand Port Maritime', destination_label_snapshot: 'Entrepôt Logistique Atlantique',
    pickup_address: 'Terminal 3, Quai des Docks, 76600 Le Havre', delivery_address: '18 rue de l’Industrie, 44100 Nantes',
    container_number: 'MSKU 742189 3', container_type: 'Dry standard', container_length_ft: 40, gross_weight_kg: 21800,
    seal_number: 'SL-884201', booking_reference: 'BK-HEV-90172', imdg_un_number: 'Non classé', reefer_temperature: 'N/A',
    notes: 'Présenter le numéro de booking à l’entrée du terminal. Vérifier le plomb avant départ.',
    stops: [
      { id: 'stop-001', mission_id: 'demo-mission-001', sequence_number: 1, stop_type: 'pickup', address_snapshot: 'Terminal 3, Quai des Docks, 76600 Le Havre', planned_at: '2026-10-25T07:30:00+02:00', instructions: 'Guichet poids lourds, file B.', location_label_snapshot: 'Terminal du Grand Port Maritime', phone: '+33 2 35 19 50 00' },
      { id: 'stop-002', mission_id: 'demo-mission-001', sequence_number: 2, stop_type: 'delivery', address_snapshot: '18 rue de l’Industrie, 44100 Nantes', planned_at: '2026-10-25T15:30:00+02:00', instructions: 'Quai 7. Appeler 15 minutes avant arrivée.', location_label_snapshot: 'Entrepôt Logistique Atlantique', phone: '+33 2 40 44 18 90' }
    ]
  },
  {
    id: 'demo-mission-002', mission_number: 'CT-2026-1049', status: 'planned', driver_id: demoDriver.id,
    client_order_reference: 'CMA-77103', planned_pickup_at: '2026-10-26T06:45:00+02:00', planned_end_at: '2026-10-26T14:30:00+02:00',
    origin_label_snapshot: 'Dépôt conteneurs Sud', destination_label_snapshot: 'Plateforme Ouest',
    pickup_address: 'Zone portuaire Sud, 17000 La Rochelle', delivery_address: '2 avenue des Frênes, 79000 Niort',
    container_number: 'CMAU 198447 0', container_type: 'High cube', container_length_ft: 40, gross_weight_kg: 19650,
    seal_number: 'À contrôler au retrait', booking_reference: 'BK-LRH-77103', imdg_un_number: 'UN 3082', reefer_temperature: 'N/A',
    notes: 'Document de transport à faire signer au quai de livraison.',
    stops: [
      { id: 'stop-003', mission_id: 'demo-mission-002', sequence_number: 1, stop_type: 'pickup', address_snapshot: 'Zone portuaire Sud, 17000 La Rochelle', planned_at: '2026-10-26T06:45:00+02:00', instructions: 'Retrait au bâtiment 4.', location_label_snapshot: 'Dépôt conteneurs Sud', phone: '+33 5 46 00 21 10' },
      { id: 'stop-004', mission_id: 'demo-mission-002', sequence_number: 2, stop_type: 'delivery', address_snapshot: '2 avenue des Frênes, 79000 Niort', planned_at: '2026-10-26T13:45:00+02:00', instructions: 'Quai 2, accès par la porte poids lourds.', location_label_snapshot: 'Plateforme Ouest', phone: '+33 5 49 28 12 40' }
    ]
  },
  {
    id: 'demo-mission-003', mission_number: 'CT-2026-1032', status: 'completed', driver_id: demoDriver.id,
    client_order_reference: 'MSC-11208', planned_pickup_at: '2026-10-22T08:00:00+02:00', planned_end_at: '2026-10-22T17:00:00+02:00',
    origin_label_snapshot: 'Port Atlantique', destination_label_snapshot: 'Usine Val de Loire',
    pickup_address: 'Port Atlantique, 44300 Nantes', delivery_address: '40 route de Tours, 49000 Angers',
    container_number: 'MSCU 300882 1', container_type: 'Dry standard', container_length_ft: 20, gross_weight_kg: 12400,
    seal_number: 'SL-881932', booking_reference: 'BK-NTE-33280', imdg_un_number: 'Non classé', reefer_temperature: 'N/A',
    notes: 'Mission clôturée.', stops: []
  }
]

export const demoMessages: MissionMessage[] = [
  { id: 'msg-001', mission_id: 'demo-mission-001', sender_role: 'dispatcher', sender_name: 'Sophie · Dispatch', body: 'Le client confirme le quai 7 à Nantes. Appelle avant d’entrer sur site.', created_at: '2026-10-25T09:12:00+02:00', read_at: null },
  { id: 'msg-002', mission_id: 'demo-mission-001', sender_role: 'driver', sender_name: 'Vous', body: 'Bien reçu, plomb contrôlé au départ.', created_at: '2026-10-25T09:18:00+02:00', read_at: '2026-10-25T09:19:00+02:00' },
  { id: 'msg-003', mission_id: 'demo-mission-002', sender_role: 'dispatcher', sender_name: 'Sophie · Dispatch', body: 'Le retrait est maintenu demain à 6 h 45.', created_at: '2026-10-24T16:40:00+02:00', read_at: null }
]
