import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// On web, expo-secure-store is unavailable   fall back to AsyncStorage.
const KEY = 'geneorx.auth.token';
const useSecureStore = Platform.OS === 'ios' || Platform.OS === 'android';

export async function getToken(): Promise<string | null> {
  if (useSecureStore) return SecureStore.getItemAsync(KEY);
  return AsyncStorage.getItem(KEY);
}

export async function setToken(token: string): Promise<void> {
  if (useSecureStore) return SecureStore.setItemAsync(KEY, token);
  await AsyncStorage.setItem(KEY, token);
}

export async function clearToken(): Promise<void> {
  if (useSecureStore) return SecureStore.deleteItemAsync(KEY);
  await AsyncStorage.removeItem(KEY);
}
