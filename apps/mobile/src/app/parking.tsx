import { ParkingScene } from '@/components/scene/parking-scene'
import { LiveBadge } from '@/components/ui/live-badge'
import { SpotActionSheet } from '@/components/ui/spot-action-sheet'
import { StatChip } from '@/components/ui/stat-chip'
import { fonts, palette, radii } from '@/theme/tokens'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
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

  useEffect(() => {
    void loadAvailability()
    const interval = setInterval(
      () => void loadAvailability(),
      AVAILABILITY_POLL_MS
    )
    return () => clearInterval(interval)
  }, [loadAvailability])

  useEffect(() => {
    if (!tokens) {
      return
    }

    let disposed = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const scheduleReconnect = () => {
      if (disposed) {
        return
      }

      clearReconnect()
      const delayMs = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5))
      attempt += 1
      reconnectTimer = setTimeout(() => {
        void connect()
      }, delayMs)
    }

    const connect = async () => {
      subscriptionRef.current?.close()
      subscriptionRef.current = null
      setRealtimeConnected(false)

      const fresh = await getFreshTokens()

      if (!fresh || disposed) {
        return
      }

      const env = readMobileEnv()

      if (!env.appsyncRealtimeEndpoint || !env.appsyncGraphqlEndpoint) {
        console.warn(
          '[parking] AppSync endpoints missing — occupancy falls back to polling'
        )
        return
      }

      subscriptionRef.current = subscribeToOccupancy({
        graphqlEndpoint: env.appsyncGraphqlEndpoint,
        realtimeEndpoint: env.appsyncRealtimeEndpoint,
        idToken: fresh.idToken,
        callbacks: {
          onConnected: () => {
            attempt = 0
            setRealtimeConnected(true)
          },
          onEvent: change => {
            setRealtimeConnected(true)
            setStatus(current =>
              current ? mergeOccupancyChange(current, change) : current
            )
          },
          onError: () => {
            setRealtimeConnected(false)
            scheduleReconnect()
          }
        }
      })
    }

    void connect()

    return () => {
      disposed = true
      clearReconnect()
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
        env.reservationApiUrl,
        fresh.idToken,
        selectedSpot.spotId,
        new Date().toISOString()
      )

      await loadAvailability()
      setSelectedSpotId(null)
    } catch (error) {
      await loadAvailability()
      setActionError(
        error instanceof Error ? error.message : 'No se pudo crear la reserva.'
      )
    } finally {
      setActionBusy(false)
    }
  }, [selectedSpot, mySpot, getFreshTokens, loadAvailability, router])

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
        env.reservationApiUrl,
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
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.canvasHost}>
        <ParkingScene
          myUserId={userId}
          selectedSpotId={selectedSpotId}
          spots={status?.spots ?? []}
          onSelectSpot={handleSelectSpot}
        />
      </View>

      <SafeAreaView edges={['top']} pointerEvents='box-none' style={styles.top}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>Polaris</Text>
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
                color={palette.spotFree}
                label='Libres'
                value={status.totalAvailable}
              />
              <StatChip
                color={palette.spotOccupied}
                label='Ocupadas'
                value={status.totalOccupied}
              />
              <StatChip
                color={palette.spotReserved}
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

        <Text pointerEvents='none' style={styles.hint}>
          Arrastra para girar · dos dedos para mover · toca una plaza
        </Text>
      </SafeAreaView>

      <SafeAreaView
        edges={['bottom']}
        pointerEvents='box-none'
        style={styles.bottom}
      >
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
        ) : null}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.background,
    flex: 1
  },
  canvasHost: {
    ...StyleSheet.absoluteFill
  },
  top: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  eyebrow: {
    color: palette.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  title: {
    color: palette.foreground,
    fontFamily: fonts.sansSemiBold,
    fontSize: 22
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8
  },
  signOut: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 13,
    textDecorationLine: 'underline'
  },
  stats: {
    flexDirection: 'row',
    gap: 8
  },
  loadError: {
    backgroundColor: palette.destructiveMuted,
    borderColor: '#fecaca',
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.destructive,
    fontFamily: fonts.sans,
    fontSize: 13,
    padding: 10
  },
  myReservation: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 10
  },
  myReservationText: {
    color: palette.spotMine,
    fontFamily: fonts.sans,
    fontSize: 13
  },
  hint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: palette.border,
    borderRadius: radii.full,
    borderWidth: 1,
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  bottom: {
    paddingHorizontal: 16,
    paddingBottom: 8
  }
})
