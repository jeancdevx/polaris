import { ParkingScene } from '@/components/scene/parking-scene'
import { LiveBadge } from '@/components/ui/live-badge'
import { SpotActionSheet } from '@/components/ui/spot-action-sheet'
import { StatChip } from '@/components/ui/stat-chip'
import { fonts, palette } from '@/theme/tokens'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  cancelReservation,
  createReservation,
  fetchAvailability
} from '@/lib/api/parking-api'
import { useAuth } from '@/lib/auth/auth-context'
import { readMobileEnv } from '@/lib/env'
import {
  findMyReservedSpot,
  mergeOccupancyChange
} from '@/lib/parking/occupancy'
import {
  subscribeToOccupancy,
  type OccupancySubscriptionHandle
} from '@/lib/realtime/appsync-ws'
import type { ParkingStatus } from '@/lib/types'

const AVAILABILITY_POLL_MS = 30_000

export default function ParkingScreen() {
  const router = useRouter()
  const { ready, tokens, userId, signOut, getFreshTokens } = useAuth()

  const [status, setStatus] = useState<ParkingStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const subscriptionRef = useRef<OccupancySubscriptionHandle | null>(null)

  const loadAvailability = useCallback(async () => {
    try {
      const env = readMobileEnv()
      const availability = await fetchAvailability(env.apiUrl)
      setStatus(availability)
      setLoadError(null)
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'No se pudo cargar el mapa.'
      )
    }
  }, [])

  // Flujo 23: carga inicial + polling suave; la subscription evita el polling agresivo.
  useEffect(() => {
    void loadAvailability()
    const interval = setInterval(
      () => void loadAvailability(),
      AVAILABILITY_POLL_MS
    )
    return () => clearInterval(interval)
  }, [loadAvailability])

  // Subscription AppSync onOccupancyChanged (auth Cognito).
  useEffect(() => {
    if (!tokens) {
      return
    }

    let disposed = false

    const connect = async () => {
      const fresh = await getFreshTokens()

      if (!fresh || disposed) {
        return
      }

      const env = readMobileEnv()

      subscriptionRef.current = subscribeToOccupancy({
        graphqlEndpoint: env.appsyncGraphqlEndpoint,
        realtimeEndpoint: env.appsyncRealtimeEndpoint,
        accessToken: fresh.accessToken,
        callbacks: {
          onEvent: change => {
            setRealtimeConnected(true)
            setStatus(current =>
              current ? mergeOccupancyChange(current, change) : current
            )
          },
          onError: () => {
            setRealtimeConnected(false)
          }
        }
      })

      setRealtimeConnected(true)
    }

    void connect()

    return () => {
      disposed = true
      subscriptionRef.current?.close()
      subscriptionRef.current = null
      setRealtimeConnected(false)
    }
  }, [tokens, getFreshTokens])

  useEffect(() => {
    if (ready && !tokens) {
      router.replace('/login')
    }
  }, [ready, tokens, router])

  const mySpot = useMemo(
    () => findMyReservedSpot(status, userId),
    [status, userId]
  )

  const selectedSpot = useMemo(
    () => status?.spots.find(spot => spot.spotId === selectedSpotId) ?? null,
    [status, selectedSpotId]
  )

  const handleSelectSpot = useCallback((spotId: string) => {
    setActionError(null)
    setSelectedSpotId(current => (current === spotId ? null : spotId))
  }, [])

  // Flujo 13: POST /parking/reserve { parkingSpotId, reservationDate } + JWT.
  const handleReserve = useCallback(async () => {
    if (!selectedSpot) {
      return
    }

    if (mySpot) {
      setActionError(
        `Ya tienes la ${mySpot.spotId.replace('spot-', 'plaza ')} ${
          mySpot.status === 'reserved' ? 'reservada' : 'ocupada'
        }.`
      )
      return
    }

    setActionBusy(true)
    setActionError(null)

    try {
      const fresh = await getFreshTokens()

      if (!fresh) {
        router.replace('/login')
        return
      }

      const env = readMobileEnv()
      await createReservation(
        env.apiUrl,
        fresh.idToken,
        selectedSpot.spotId,
        new Date().toISOString()
      )

      await loadAvailability()
      setSelectedSpotId(null)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'No se pudo crear la reserva.'
      )
    } finally {
      setActionBusy(false)
    }
  }, [selectedSpot, mySpot, getFreshTokens, loadAvailability, router])

  // Flujo 14: DELETE /parking/reserve/{id} + JWT.
  const handleCancelReservation = useCallback(async () => {
    if (!selectedSpot?.reservationId) {
      setActionError('No se encontró el identificador de la reserva.')
      return
    }

    setActionBusy(true)
    setActionError(null)

    try {
      const fresh = await getFreshTokens()

      if (!fresh) {
        router.replace('/login')
        return
      }

      const env = readMobileEnv()
      await cancelReservation(
        env.apiUrl,
        fresh.idToken,
        selectedSpot.reservationId
      )

      await loadAvailability()
      setSelectedSpotId(null)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'No se pudo cancelar la reserva.'
      )
    } finally {
      setActionBusy(false)
    }
  }, [selectedSpot, getFreshTokens, loadAvailability, router])

  const handleSignOut = useCallback(async () => {
    await signOut()
    router.replace('/login')
  }, [signOut, router])

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <ParkingScene
          myUserId={userId}
          selectedSpotId={selectedSpotId}
          spots={status?.spots ?? []}
          onSelectSpot={handleSelectSpot}
        />
      </View>

      <SafeAreaView pointerEvents='box-none' style={styles.overlay}>
        <View pointerEvents='box-none' style={styles.top}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>POLARIS</Text>
              <Text style={styles.title}>Estacionamiento</Text>
            </View>
            <View style={styles.headerActions}>
              <LiveBadge connected={realtimeConnected} />
              <Pressable hitSlop={8} onPress={handleSignOut}>
                <Text style={styles.signOut}>Salir</Text>
              </Pressable>
            </View>
          </View>

          {status ? (
            <View style={styles.stats}>
              <StatChip
                color={palette.free}
                label='Libres'
                value={status.totalAvailable}
              />
              <StatChip
                color={palette.occupied}
                label='Ocupadas'
                value={status.totalOccupied}
              />
              <StatChip
                color={palette.reserved}
                label='Reservadas'
                value={status.totalReserved}
              />
            </View>
          ) : null}

          {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
          {mySpot && !selectedSpot ? (
            <Pressable
              style={styles.myReservation}
              onPress={() => handleSelectSpot(mySpot.spotId)}
            >
              <Text style={styles.myReservationText}>
                {mySpot.status === 'reserved'
                  ? `Tienes reservada la ${mySpot.spotId.replace('spot-', 'plaza ')} — toca para ver`
                  : `Tu vehículo está en la ${mySpot.spotId.replace('spot-', 'plaza ')}`}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View pointerEvents='box-none' style={styles.bottom}>
          {selectedSpot ? (
            <SpotActionSheet
              busy={actionBusy}
              error={actionError}
              mine={Boolean(userId && selectedSpot.userId === userId)}
              spot={selectedSpot}
              onCancelReservation={handleCancelReservation}
              onClose={() => setSelectedSpotId(null)}
              onReserve={handleReserve}
            />
          ) : (
            <Text style={styles.helper}>
              Toca una plaza libre para reservarla
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.bg,
    flex: 1
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16
  },
  top: {
    gap: 12
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  eyebrow: {
    color: palette.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3
  },
  title: {
    color: palette.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 26
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 10
  },
  signOut: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 13,
    textDecorationLine: 'underline'
  },
  stats: {
    flexDirection: 'row',
    gap: 10
  },
  loadError: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#fecaca',
    fontFamily: fonts.sans,
    fontSize: 13,
    padding: 12
  },
  myReservation: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderColor: 'rgba(45, 212, 191, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12
  },
  myReservationText: {
    color: '#99f6e4',
    fontFamily: fonts.sans,
    fontSize: 13
  },
  bottom: {
    gap: 10
  },
  helper: {
    color: palette.muted,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center'
  }
})
