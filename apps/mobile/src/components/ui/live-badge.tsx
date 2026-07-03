import { fonts, palette, radii } from '@/theme/tokens'
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
        {connected ? 'En vivo' : 'Sin conexión'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: palette.secondary,
    borderColor: palette.border,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeOffline: {
    backgroundColor: palette.secondary
  },
  dot: {
    backgroundColor: palette.spotFree,
    borderRadius: radii.full,
    height: 7,
    width: 7
  },
  dotOffline: {
    backgroundColor: palette.muted
  },
  text: {
    color: palette.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 11
  },
  textOffline: {
    color: palette.muted
  }
})
