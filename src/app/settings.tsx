import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

export default function SettingsScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('user-language');
      if (savedLang) {
        setSelectedLanguage(savedLang);
      }
    } catch (error) {
      console.error('Failed to load language', error);
    }
  };

  const changeLanguage = async (lang: string) => {
    try {
      setSelectedLanguage(lang);
      await AsyncStorage.setItem('user-language', lang);
      (i18n as any).locale = lang;
    } catch (error) {
      console.error('Failed to save language', error);
    }
  };

  const getStoredUsername = async (): Promise<string> => {
    const rawUser =
      (await AsyncStorage.getItem('username')) ||
      (await AsyncStorage.getItem('userToken_v1')) ||
      '';

    if (!rawUser) return '';

    try {
      const parsed = JSON.parse(rawUser);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed.username || parsed.user?.username || '';
      }
      return String(parsed);
    } catch {
      return rawUser;
    }
  };

  const handleLogout = async () => {
    try {
      const username = await getStoredUsername();

      await fetch(
        'https://script.google.com/macros/s/AKfycbzODnyd9UFHAto4NUhwvRfbgdHjdf9-aoQMf5sSk-wEvB3FL_S9velr2n0rjffhqSv3/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'logout',
            username: username,
          }),
        }
      );

      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('userToken_v1');
      await AsyncStorage.removeItem('userTokenv1');
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout properly.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>भाषा चुनें (Select Language)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => changeLanguage(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Hindi" value="hi" />
            <Picker.Item label="Marathi (मराठी)" value="mr" />
            <Picker.Item label="Bengali (বাংলা)" value="bn" />
            <Picker.Item label="Telugu (తెలుగు)" value="te" />
            <Picker.Item label="Tamil (தமிழ்)" value="ta" />
            <Picker.Item label="Gujarati (ગુજરાતી)" value="gu" />
            <Picker.Item label="Kannada (ಕನ್ನಡ)" value="kn" />
            <Picker.Item label="Malayalam (മലയാളം)" value="ml" />
            <Picker.Item label="Punjabi (ਪੰਜਾਬੀ)" value="pa" />
            <Picker.Item label="Odia (ଓଡ଼ିଆ)" value="or" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
  },
  pickerContainer: {
    height: 50,
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#E74C3C',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});