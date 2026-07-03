import { fonts, palette, radii } from '@/theme/tokens'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/lib/auth/auth-context'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await signIn(email.trim(), password)
      router.replace('/parking')
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'No se pudo iniciar sesión.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Polaris · Estacionamiento IoT</Text>
          <Text style={styles.title}>Tu plaza, en tiempo real</Text>
          <Text style={styles.subtitle}>
            Explora el estacionamiento en 3D, reserva tu plaza y entra con tu
            tarjeta RFID.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              autoCapitalize='none'
              autoComplete='email'
              keyboardType='email-address'
              placeholder='usuario@polaris.dev'
              placeholderTextColor={palette.muted}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              autoComplete='password'
              placeholder='••••••••'
              placeholderTextColor={palette.muted}
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              (pressed || loading) && styles.buttonPressed
            ]}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color={palette.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>
            Las cuentas las crea un administrador. Si no tienes acceso, contacta
            al operador del estacionamiento.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1
  },
  container: {
    flex: 1,
    gap: 28,
    justifyContent: 'center',
    padding: 24
  },
  hero: {
    gap: 10
  },
  eyebrow: {
    color: palette.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  title: {
    color: palette.foreground,
    fontFamily: fonts.sansSemiBold,
    fontSize: 32,
    lineHeight: 36
  },
  subtitle: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  cardTitle: {
    color: palette.foreground,
    fontFamily: fonts.sansSemiBold,
    fontSize: 18
  },
  field: {
    gap: 6
  },
  label: {
    color: palette.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 13
  },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.foreground,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11
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
  button: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    paddingVertical: 13
  },
  buttonPressed: {
    opacity: 0.8
  },
  buttonText: {
    color: palette.primaryForeground,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15
  },
  hint: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  }
})
