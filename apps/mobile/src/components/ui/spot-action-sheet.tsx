import { fonts, palette, radii, statusColor } from '@/theme/tokens'
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
          <Text style={styles.zone}>Zona {spot.zone.toUpperCase()}</Text>
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
            <ActivityIndicator color={palette.primaryForeground} />
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
            <ActivityIndicator color={palette.destructive} />
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
          Reservada por otro usuario. El LED de la plaza parpadea hasta que
          llegue su vehículo.
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
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  statusDot: {
    borderRadius: radii.full,
    height: 10,
    width: 10
  },
  title: {
    color: palette.foreground,
    fontFamily: fonts.sansSemiBold,
    fontSize: 18
  },
  zone: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 11
  },
  close: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 16
  },
  status: {
    fontFamily: fonts.sansMedium,
    fontSize: 13
  },
  error: {
    backgroundColor: palette.destructiveMuted,
    borderColor: '#fecaca',
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.destructive,
    fontFamily: fonts.sans,
    fontSize: 13,
    padding: 10
  },
  action: {
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 12
  },
  actionReserve: {
    backgroundColor: palette.primary
  },
  actionReserveText: {
    color: palette.primaryForeground,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15
  },
  actionCancel: {
    backgroundColor: palette.destructiveMuted,
    borderColor: '#fecaca',
    borderWidth: 1
  },
  actionCancelText: {
    color: palette.destructive,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15
  },
  actionPressed: {
    opacity: 0.75
  },
  hint: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19
  }
})
