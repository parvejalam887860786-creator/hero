import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './authcontext';
import { LanguageProvider } from './languagecontext';

export default function RootLayout() {
  useEffect(() => {
    const checkUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        router.replace('/home');
      }
    };
    checkUser();
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </AuthProvider>
  );
}