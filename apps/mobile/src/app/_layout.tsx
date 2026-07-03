import { palette } from '@/theme/tokens'
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  useFonts
} from '@expo-google-fonts/geist'
import {
  GeistMono_400Regular,
  GeistMono_500Medium
} from '@expo-google-fonts/geist-mono'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AuthProvider } from '@/lib/auth/auth-context'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium
  })

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style='dark' />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.background }
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
