import { fonts, palette } from '@/theme/tokens'
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
          <Text style={styles.eyebrow}>POLARIS · IOT PARKING</Text>
          <Text style={styles.title}>Tu plaza,{'\n'}en tiempo real</Text>
          <Text style={styles.subtitle}>
            Visualiza el estacionamiento en 3D, reserva tu plaza y entra con tu
            tarjeta RFID.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>

          <View style={styles.field}>
            <Text style={styles.label}>CORREO</Text>
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
            <Text style={styles.label}>CONTRASEÑA</Text>
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
              <ActivityIndicator color={palette.bg} />
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
    flex: 1,
    backgroundColor: palette.bg
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 28
  },
  hero: {
    gap: 12
  },
  eyebrow: {
    color: palette.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 3
  },
  title: {
    color: palette.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 40,
    lineHeight: 44
  },
  subtitle: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 24
  },
  cardTitle: {
    color: palette.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 20
  },
  field: {
    gap: 8
  },
  label: {
    color: palette.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2
  },
  input: {
    backgroundColor: palette.bg,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    color: palette.ink,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12
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
  button: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 999,
    paddingVertical: 15
  },
  buttonPressed: {
    opacity: 0.75
  },
  buttonText: {
    color: palette.bg,
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
