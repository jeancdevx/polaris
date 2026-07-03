import { fonts, palette } from '@/theme/tokens'
import { StyleSheet, Text, View } from 'react-native'

type StatChipProps = Readonly<{
  label: string
  value: number
  color?: string
}>

export const StatChip = ({
  label,
  value,
  color = palette.ink
}: StatChipProps) => (
  <View style={styles.chip}>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
)

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 30, 43, 0.88)',
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingVertical: 10
  },
  value: {
    fontFamily: fonts.monoMedium,
    fontSize: 22
  },
  label: {
    color: palette.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  }
})
