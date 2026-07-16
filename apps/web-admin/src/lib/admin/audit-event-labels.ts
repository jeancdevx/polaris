/** Known audit event types written by event-processor (and related jobs). */
export const AUDIT_EVENT_TYPE_OPTIONS = [
  { value: 'walk_in_entry', label: 'Ingreso walk-in' },
  { value: 'walk_in_exit', label: 'Salida walk-in' },
  { value: 'vehicle.entry', label: 'Ingreso a plaza' },
  { value: 'vehicle.exit', label: 'Salida de plaza' },
  { value: 'rfid_denied', label: 'RFID denegado' },
  { value: 'reservation.created', label: 'Reserva creada' },
  { value: 'reservation.cancelled', label: 'Reserva cancelada' },
  { value: 'reservation_expired', label: 'Reserva expirada' },
  { value: 'anomaly_unregistered_occupancy', label: 'Ocupación sin ingreso' },
  { value: 'passage_stalled', label: 'Vehículo estancado' },
  { value: 'exit_barrier_timeout', label: 'Timeout barrera salida' }
] as const

const labelByType = new Map(
  AUDIT_EVENT_TYPE_OPTIONS.map(option => [option.value, option.label])
)

export const formatAuditEventType = (eventType: string): string =>
  labelByType.get(
    eventType as (typeof AUDIT_EVENT_TYPE_OPTIONS)[number]['value']
  ) ?? eventType
