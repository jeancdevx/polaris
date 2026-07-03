import { fonts, palette } from '@/theme/tokens'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

type LiveBadgeProps = Readonly<{
  connected: boolean
}>

export const LiveBadge = ({ connected }: LiveBadgeProps) => {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!connected) {
      pulse.setValue(1)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        })
      ])
    )

    animation.start()
    return () => animation.stop()
  }, [connected, pulse])

  return (
    <View style={[styles.badge, !connected && styles.badgeOffline]}>
      <Animated.View
        style={[
          styles.dot,
          { opacity: pulse },
          !connected && styles.dotOffline
        ]}
      />
      <Text style={[styles.text, !connected && styles.textOffline]}>
        {connected ? 'EN VIVO' : 'SIN CONEXIÓN'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  badgeOffline: {
    backgroundColor: 'rgba(143, 163, 188, 0.1)',
    borderColor: palette.border
  },
  dot: {
    backgroundColor: palette.live,
    borderRadius: 999,
    height: 7,
    width: 7
  },
  dotOffline: {
    backgroundColor: palette.muted
  },
  text: {
    color: '#fde68a',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2
  },
  textOffline: {
    color: palette.muted
  }
})
