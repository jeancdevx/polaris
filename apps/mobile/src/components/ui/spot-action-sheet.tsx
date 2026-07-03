import { fonts, palette, statusColor } from '@/theme/tokens'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'

import { statusLabel } from '@/lib/parking/occupancy'
import type { ParkingSpot } from '@/lib/types'

type SpotActionSheetProps = Readonly<{
  spot: ParkingSpot
  mine: boolean
  busy: boolean
  error: string | null
  onReserve: () => void
  onCancelReservation: () => void
  onClose: () => void
}>

const spotDisplayName = (spotId: string): string =>
  spotId.replace('spot-', 'Plaza ')

export const SpotActionSheet = ({
  spot,
  mine,
  busy,
  error,
  onReserve,
  onCancelReservation,
  onClose
}: SpotActionSheetProps) => {
  const color = statusColor[spot.status]

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={styles.title}>{spotDisplayName(spot.spotId)}</Text>
          <Text style={styles.zone}>ZONA {spot.zone.toUpperCase()}</Text>
        </View>
        <Pressable hitSlop={12} onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <Text style={[styles.status, { color }]}>
        {statusLabel[spot.status]}
        {mine ? ' · tu reserva' : ''}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {spot.status === 'free' ? (
        <Pressable
          disabled={busy}
          style={({ pressed }) => [
            styles.action,
            styles.actionReserve,
            (pressed || busy) && styles.actionPressed
          ]}
          onPress={onReserve}
        >
          {busy ? (
            <ActivityIndicator color={palette.bg} />
          ) : (
            <Text style={styles.actionReserveText}>Reservar esta plaza</Text>
          )}
        </Pressable>
      ) : null}

      {mine && spot.status === 'reserved' ? (
        <Pressable
          disabled={busy}
          style={({ pressed }) => [
            styles.action,
            styles.actionCancel,
            (pressed || busy) && styles.actionPressed
          ]}
          onPress={onCancelReservation}
        >
          {busy ? (
            <ActivityIndicator color={palette.danger} />
          ) : (
            <Text style={styles.actionCancelText}>Cancelar reserva</Text>
          )}
        </Pressable>
      ) : null}

      {spot.status === 'occupied' && !mine ? (
        <Text style={styles.hint}>
          Plaza ocupada por otro vehículo. El sensor infrarrojo la liberará
          cuando quede vacía.
        </Text>
      ) : null}

      {spot.status === 'reserved' && !mine ? (
        <Text style={styles.hint}>
          Reservada por otro usuario. El LED de la plaza parpadea en verde hasta
          que llegue su vehículo.
        </Text>
      ) : null}

      {mine && spot.status === 'occupied' ? (
        <Text style={styles.hint}>
          Tu vehículo está estacionado aquí. Al salir, presenta tu tarjeta RFID
          en la barrera de salida.
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(20, 30, 43, 0.97)',
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  statusDot: {
    borderRadius: 999,
    height: 10,
    width: 10
  },
  title: {
    color: palette.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 20
  },
  zone: {
    color: palette.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2
  },
  close: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 16
  },
  status: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    letterSpacing: 1
  },
  error: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#fecaca',
    fontFamily: fonts.sans,
    fontSize: 13,
    padding: 12
  },
  action: {
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 14
  },
  actionReserve: {
    backgroundColor: palette.accent
  },
  actionReserveText: {
    color: palette.bg,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15
  },
  actionCancel: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
    borderWidth: 1
  },
  actionCancelText: {
    color: palette.danger,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15
  },
  actionPressed: {
    opacity: 0.7
  },
  hint: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19
  }
})
