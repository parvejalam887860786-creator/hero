import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ध्यान दें: सुनिश्चित करें कि यह URL आपके मुख्य Apps Script से मेल खाता हो
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwKWEmg7wYAj0ZIEvKlhyi8cFw1sYiqZ65ydKzWlvKJhLpVSnsD0jXRk7MLtOcr7f3l/exec';

export default function ProfileScreen() {
  const params = useLocalSearchParams();

  // यूजरनेम (User ID) लॉक रहेगा — इसे बदला नहीं जा सकेगा
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [email, setEmail] = useState<string>((params.email as string) || '');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const [saving, setSaving] = useState<boolean>(false);

  // लॉगिन पेज से AsyncStorage में सेव किया गया डेटा लोड करें
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedProfileStr = await AsyncStorage.getItem('userProfile');
        const savedToken = await AsyncStorage.getItem('userToken_v1');

        if (savedProfileStr) {
          const savedProfile = JSON.parse(savedProfileStr);
          if (savedProfile.username) setUsername(savedProfile.username);
          if (savedProfile.fullName) setFullName(savedProfile.fullName);
          if (savedProfile.title) setTitle(savedProfile.title);
          if (savedProfile.email) setEmail(savedProfile.email);
          if (savedProfile.phone) setPhone(savedProfile.phone);
          if (savedProfile.address) setAddress(savedProfile.address);
          if (savedProfile.bio) setBio(savedProfile.bio);
          if (savedProfile.avatar) setAvatar(savedProfile.avatar);
        } else if (savedToken) {
          setUsername(savedToken);
        }
      } catch {
        // Silent catch for storage read
      }
    };

    loadProfileData();
  }, []);

  // फोन नंबर में केवल 10 अंक ही टाइप होने दें
  const handlePhoneChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    if (numericOnly.length <= 10) {
      setPhone(numericOnly);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'प्रोफाइल फोटो बदलने के लिए गैलरी की अनुमति (Permission) आवश्यक है।'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // आधुनिक Expo ImagePicker सिंटैक्स
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedFullName = fullName.trim();
    const trimmedTitle = title.trim();
    const trimmedAddress = address.trim();
    const trimmedBio = bio.trim();

    // 1. इनपुट वैलिडेशन (सुरक्षा और डेटा शुद्धता के लिए)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!trimmedFullName) {
      Alert.alert('अनिवार्य फील्ड', 'कृपया अपना पूरा नाम (Full Name) दर्ज करें।');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('गलत Email', 'कृपया सही Email पता दर्ज करें।');
      return;
    }

    if (!phoneRegex.test(trimmedPhone)) {
      Alert.alert(
        'गलत Phone Number',
        'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    setSaving(true);

    // 15 सेकंड का नेटवर्क टाइमआउट
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const updatedProfile = {
      username, // लॉक / Read-only यूजरनेम
      fullName: trimmedFullName,
      title: trimmedTitle,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      bio: trimmedBio,
      avatar,
    };

    try {
      // लोकल स्टोरेज अपडेट करें
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      const currentTimestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });

      // Profiles शीट के हेडर्स के अनुसार सटीक पेलोड:
      // Timestamp, Username, Full Name, Title, Email, Phone Number, Address, Bio
      const payload = {
        action: 'updateProfile',
        timestamp: currentTimestamp,
        username: username,
        fullName: trimmedFullName,
        title: trimmedTitle,
        email: trimmedEmail,
        phone: trimmedPhone,
        phoneNumber: trimmedPhone, // बैकएंड संगतता के लिए
        address: trimmedAddress,
        bio: trimmedBio,
      };

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: { status?: string; message?: string } = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { status: 'success' };
      }

      setSaving(false);

      if (data.status === 'error') {
        Alert.alert(
          'अपडेट विफल (Update Failed)',
          data.message || 'शीट में डेटा अपडेट नहीं हो सका।'
        );
        return;
      }

      Alert.alert('Success', 'आपकी प्रोफाइल की जानकारी सुरक्षित रूप से सेव हो गई है।');
    } catch (error: any) {
      clearTimeout(timeoutId);
      setSaving(false);
      if (error.name === 'AbortError') {
        Alert.alert(
          'Timeout Error',
          'सर्वर से जवाब आने में अधिक समय लग रहा है। लोकल डेटा सेव हो गया है।'
        );
      } else {
        Alert.alert(
          'Network Warning',
          'इंटरनेट कनेक्शन न होने के कारण डेटा केवल फोन में सेव हुआ है।'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/home')}
          >
            <Ionicons name="arrow-back" size={28} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.userProfileHeader}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Locked Username / User ID */}
            <View style={styles.lockedBadgeRow}>
              <Text style={styles.userIdLabel}>Username / User ID (Locked)</Text>
              <Ionicons name="lock-closed" size={14} color="#6C757D" />
            </View>
            <View style={styles.userIdContainer}>
              <Text style={styles.userId}>{username || 'Loading...'}</Text>
            </View>

            <Text style={styles.userName}>{fullName || 'Your Name'}</Text>
            <Text style={styles.userTitle}>{title || 'Your Title / Role'}</Text>
          </View>

          {/* 1. Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="अपना पूरा नाम दर्ज करें"
                placeholderTextColor="#888"
              />
              <Ionicons
                name="pencil"
                size={18}
                color="#007AFF"
                style={styles.editIcon}
              />
            </View>
          </View>

          {/* 2. Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title / Profession</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="उदाहरण: Electrical Contractor / Developer"
                placeholderTextColor="#888"
              />
              <Ionicons
                name="pencil"
                size={18}
                color="#007AFF"
                style={styles.editIcon}
              />
            </View>
          </View>

          {/* 3. Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Ionicons
                name="pencil"
                size={18}
                color="#007AFF"
                style={styles.editIcon}
              />
            </View>
          </View>

          {/* 4. Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number (10 अंक) *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="10 अंकों का मोबाइल नंबर"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                maxLength={10}
              />
              <Ionicons
                name="pencil"
                size={18}
                color="#007AFF"
                style={styles.editIcon}
              />
            </View>
          </View>

          {/* 5. Address (लॉगिन से ऑटो-फिल होगा, यूजर इसे एडिट भी कर सकता है) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { minHeight: 50 }]}
                value={address}
                onChangeText={setAddress}
                placeholder="अपना पता दर्ज करें"
                placeholderTextColor="#888"
                multiline
              />
              <Ionicons
                name="location-outline"
                size={20}
                color="#007AFF"
                style={styles.editIcon}
              />
            </View>
          </View>

          {/* 6. Bio */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="अपने बारे में कुछ लिखें..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.75 }]}
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.versionText}>v1.1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  userProfileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  lockedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  userIdLabel: {
    fontSize: 12,
    color: '#6C757D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userIdContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
    marginBottom: 12,
    width: '70%',
    alignItems: 'center',
  },
  userId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CED4DA',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  editIcon: {
    paddingHorizontal: 12,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CED4DA',
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 12,
    marginTop: 25,
  },
});