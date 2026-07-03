import { fonts, palette, radii } from '@/theme/tokens'
import { StyleSheet, Text, View } from 'react-native'

type StatChipProps = Readonly<{
  label: string
  value: number
  color?: string
}>

export const StatChip = ({
  label,
  value,
  color = palette.foreground
}: StatChipProps) => (
  <View style={styles.chip}>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
)

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: palette.secondary,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingVertical: 8
  },
  value: {
    fontFamily: fonts.monoMedium,
    fontSize: 20
  },
  label: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 10,
    textTransform: 'uppercase'
  }
})
