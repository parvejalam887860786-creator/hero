import * as Location from 'expo-location';
import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbztjttZzT7B7lmjs2mzsu-segcvWqbXJkyKadZWoJlb2o48QHjzLjoSVAtSDcnKm-cn/exec';

export async function forceLogoutUser(
  reasonMessage = 'आपका अकाउंट या सेशन समाप्त कर दिया गया है। कृपया दोबारा लॉगिन करें।'
) {
  try {
    await AsyncStorage.multiRemove(['userProfile', 'userToken_v1']);
  } catch (e) {
    console.warn('Logout storage cleanup error:', e);
  }
  Alert.alert('सेशन समाप्त (Logged Out)', reasonMessage, [
    {
      text: 'OK',
      onPress: () => {
        router.replace('/');
      },
    },
  ]);
}

type FieldErrors = {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export default function SignInScreen() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const [resetModalVisible, setResetModalVisible] = useState<boolean>(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetOtp, setResetOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    phone: false,
    password: false,
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  const isEmailValid = emailRegex.test(email.trim());
  const isPhoneValid = phoneRegex.test(phoneNumber.trim());
  const isPasswordValid = password.trim().length >= 6;
  const isUsernameValid =
    username.trim() === '' || usernameRegex.test(username.trim());

  const isFormValid = useMemo(() => {
    return isEmailValid && isPhoneValid && isPasswordValid && isUsernameValid;
  }, [isEmailValid, isPhoneValid, isPasswordValid, isUsernameValid]);

  const usernameErrorText =
    serverErrors.username ||
    (touched.username && !isUsernameValid
      ? 'Username 3 से 20 अक्षरों का होना चाहिए (केवल अक्षर, अंक और _)।'
      : '');

  const emailErrorText =
    serverErrors.email ||
    (touched.email && !isEmailValid
      ? 'कृपया सही Email पता दर्ज करें (जैसे: name@domain.com)।'
      : '');

  const phoneErrorText =
    serverErrors.phone ||
    (touched.phone && !isPhoneValid
      ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
      : '');

  const passwordErrorText =
    serverErrors.password ||
    (touched.password && !isPasswordValid
      ? 'Password कम से कम 6 अक्षरों का होना अनिवार्य है।'
      : '');

  const generateUniqueUsername = (emailStr: string, phoneStr: string) => {
    let base = 'user';
    if (emailStr && emailStr.includes('@')) {
      base = emailStr
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    } else if (phoneStr && phoneStr.length >= 4) {
      base = 'user' + phoneStr.slice(-4);
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${base}_${randomDigits}`.toLowerCase();
  };

  const handlePhoneChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    if (numericOnly.length <= 10) {
      setPhoneNumber(numericOnly);
      if (serverErrors.phone) {
        setServerErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
  };

  const getLocationDetails = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return 'Location permission denied';
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      let readableAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const parts = [
            place.name,
            place.street,
            place.district || place.subregion,
            place.city,
            place.region,
            place.postalCode,
          ].filter(Boolean);
          if (parts.length > 0) {
            readableAddress = `${parts.join(', ')} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocode failed, using coordinates:', geoErr);
      }

      return readableAddress;
    } catch (error) {
      console.warn('Location error:', error);
      return 'Location not found';
    }
  };

  const openResetModal = () => {
    setResetError('');
    setResetOtp('');
    setNewPassword('');
    setResetStep(1);
    if (email.trim()) {
      setResetMethod('email');
      setResetIdentifier(email.trim().toLowerCase());
    } else if (phoneNumber.trim()) {
      setResetMethod('phone');
      setResetIdentifier(phoneNumber.trim());
    } else {
      setResetMethod('email');
      setResetIdentifier('');
    }
    setResetModalVisible(true);
  };

  const switchResetMethod = (method: 'email' | 'phone') => {
    setResetMethod(method);
    setResetError('');
    setResetIdentifier(
      method === 'email' ? email.trim().toLowerCase() : phoneNumber.trim()
    );
  };

  const handleSendOtp = async () => {
    setResetError('');
    const target =
      resetMethod === 'email'
        ? resetIdentifier.trim().toLowerCase()
        : resetIdentifier.trim();

    if (resetMethod === 'email' && !emailRegex.test(target)) {
      setResetError('कृपया मान्य Email पता दर्ज करें।');
      return;
    }
    if (resetMethod === 'phone' && !phoneRegex.test(target)) {
      setResetError('कृपया 10 अंकों का वैध Phone Number दर्ज करें।');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          identifier: target,
          method: resetMethod,
        }),
      });
      const text = await response.text();
      const data = JSON.parse(text);

      if (data.status === 'error') {
        setResetError(data.message || 'OTP भेजने में विफल।');
      } else {
        Alert.alert('OTP भेजा गया', data.message || '6 अंकों का OTP भेजा गया है।');
        setResetStep(2);
      }
    } catch (err: any) {
      setResetError(err?.message || 'सर्वर से संपर्क नहीं हो पाया।');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    setResetError('');
    const target =
      resetMethod === 'email'
        ? resetIdentifier.trim().toLowerCase()
        : resetIdentifier.trim();

    if (resetOtp.trim().length !== 6) {
      setResetError('कृपया 6 अंकों का OTP दर्ज करें।');
      return;
    }
    if (newPassword.trim().length < 6) {
      setResetError('नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          identifier: target,
          otp: resetOtp.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const text = await response.text();
      const data = JSON.parse(text);

      if (data.status === 'error') {
        setResetError(data.message || 'OTP गलत या समाप्त हो चुका है।');
      } else {
        Alert.alert(
          'सफल (Success)',
          'आपका पासवर्ड बदल दिया गया है। अब नए पासवर्ड से लॉगिन करें।'
          );
        if (resetMethod === 'email') {
          setEmail(target);
        } else {
          setPhoneNumber(target);
        }
        setPassword('');
        setServerErrors({});
        setResetModalVisible(false);
      }
    } catch (err: any) {
      setResetError(err?.message || 'सर्वर से संपर्क नहीं हो पाया।');
    } finally {
      setResetLoading(false);
    }
  };

  const mapServerErrorToField = (field?: string, message?: string): FieldErrors => {
    const msg = message || 'अमान्य जानकारी';
    const lowerMsg = msg.toLowerCase();

    if (field === 'username' || lowerMsg.includes('username')) {
      return { username: msg };
    }
    if (field === 'email' || lowerMsg.includes('email')) {
      return { email: msg };
    }
    if (field === 'phone' || lowerMsg.includes('phone') || lowerMsg.includes('number')) {
      return { phone: msg };
    }
    if (field === 'password' || lowerMsg.includes('password') || lowerMsg.includes('पासवर्ड')) {
      return { password: msg };
    }
    return { password: msg };
  };

  const handleSignIn = async () => {
    setTouched({
      username: true,
      email: true,
      phone: true,
      password: true,
    });
    setServerErrors({});

    if (!isFormValid) {
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const finalUsername = trimmedUsername
        ? trimmedUsername
        : generateUniqueUsername(trimmedEmail, trimmedPhone);

      const addressDetails = await getLocationDetails();
      const currentTimestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });

      const payload = {
        action: 'login',
        timestamp: currentTimestamp,
        username: finalUsername,
        email: trimmedEmail,
        phone: trimmedPhone,
        phoneNumber: trimmedPhone,
        password: password,
        address: addressDetails,
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

      let data: {
        status?: string;
        field?: string;
        message?: string;
        username?: string;
        code?: string;
        forceLogout?: boolean;
      } = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { status: 'success', username: finalUsername };
      }

      const combinedSignal = `${data.code || ''} ${data.message || ''}`.toLowerCase();
      const shouldLogout =
        data.forceLogout === true ||
        data.code === 'ACCOUNT_DELETED' ||
        data.code === 'UNAUTHORIZED' ||
        combinedSignal.includes('deleted') ||
        combinedSignal.includes('deactivated') ||
        combinedSignal.includes('unauthorized');

      if (shouldLogout) {
        setLoading(false);
        await forceLogoutUser(
          data.message ||
            'यह अकाउंट डिलीट या निष्क्रिय कर दिया गया है। आपको लॉगआउट किया जा रहा है।'
        );
        return;
      }

      if (data.status === 'error' || !response.ok) {
        setLoading(false);
        const mappedErrors = mapServerErrorToField(
          data.field,
          data.message ||
            'दर्ज की गई जानकारी सही नहीं है। कृपया संबंधित फील्ड जांचें।'
        );
        setServerErrors(mappedErrors);
        return;
      }

      const verifiedUsername = data.username || finalUsername;

      const userProfileData = {
        username: verifiedUsername,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: addressDetails,
      };

      await AsyncStorage.setItem(
        'userProfile',
        JSON.stringify(userProfileData)
      );
      await AsyncStorage.setItem('userToken_v1', verifiedUsername);

      setLoading(false);
      router.replace('/home');
    } catch (error: any) {
      clearTimeout(timeoutId);
      setLoading(false);
      if (error.name === 'AbortError') {
        Alert.alert(
          'Timeout Error',
          'सर्वर से जवाब आने में बहुत समय लग रहा है (15 सेकंड पूरे हो गए)। कृपया दोबारा प्रयास करें।'
        );
      } else {
        Alert.alert(
          'Network / Server Error',
          error?.message ||
            'लॉगिन डेटा भेजने में समस्या हुई। कृपया इंटरनेट कनेक्शन या सर्वर URL जांचें।'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#1F2937" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logoImage}
            />
            <Text style={styles.appLogoText}>APP LOGO</Text>
          </View>

          <Text style={styles.title}>Sign In</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Username (खाली छोड़ने पर यूनिक नाम ऑटो-जनरेट होगा)
            </Text>
            <TextInput
              style={[
                styles.input,
                Boolean(usernameErrorText) && styles.inputError,
              ]}
              placeholder="उदाहरण: chand_01 (केवल अक्षर, अंक और _)"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
              onChangeText={(text) => {
                setUsername(text.replace(/\s/g, ''));
                if (serverErrors.username) {
                  setServerErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
            />
            {Boolean(usernameErrorText) && (
              <Text style={styles.errorText}>{usernameErrorText}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[
                styles.input,
                Boolean(emailErrorText) && styles.inputError,
              ]}
              placeholder="example@gmail.com"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              onChangeText={(text) => {
                setEmail(text);
                if (serverErrors.email) {
                  setServerErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
            />
            {Boolean(emailErrorText) && (
              <Text style={styles.errorText}>{emailErrorText}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (10 अंक) *</Text>
            <TextInput
              style={[
                styles.input,
                Boolean(phoneErrorText) && styles.inputError,
              ]}
              placeholder="10 अंकों का मोबाइल नंबर दर्ज करें"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              maxLength={10}
              value={phoneNumber}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              onChangeText={handlePhoneChange}
            />
            {Boolean(phoneErrorText) && (
              <Text style={styles.errorText}>{phoneErrorText}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password (कम से कम 6 अक्षर) *</Text>
            <View
              style={[
                styles.passwordWrapper,
                Boolean(passwordErrorText) && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="अपना पासवर्ड दर्ज करें"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, password: true }))
                }
                onChangeText={(text) => {
                  setPassword(text);
                  if (serverErrors.password) {
                    setServerErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {Boolean(passwordErrorText) && (
              <Text style={styles.errorText}>{passwordErrorText}</Text>
            )}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={openResetModal}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.signInButton,
              loading && styles.signInButtonDisabled,
            ]}
            onPress={handleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>SIGN IN</Text>
          </TouchableOpacity>

          <View style={styles.socialContainer}>
            <TouchableOpacity>
              <Image
                source={require('../../assets/images/gogle png.webp')}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <Text style={styles.orText}>or</Text>
            <TouchableOpacity>
              <Image
                source={require('../../assets/images/fb png.png')}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>v1.0.4</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setResetModalVisible(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {resetStep === 1 ? (
              <>
                <View style={styles.methodToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.methodTab,
                      resetMethod === 'email' && styles.methodTabActive,
                    ]}
                    onPress={() => switchResetMethod('email')}
                  >
                    <Text
                      style={[
                        styles.methodTabText,
                        resetMethod === 'email' && styles.methodTabTextActive,
                      ]}
                    >
                      Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.methodTab,
                      resetMethod === 'phone' && styles.methodTabActive,
                    ]}
                    onPress={() => switchResetMethod('phone')}
                  >
                    <Text
                      style={[
                        styles.methodTabText,
                        resetMethod === 'phone' && styles.methodTabTextActive,
                      ]}
                    >
                      Phone Number
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  {resetMethod === 'email'
                    ? 'अपना रजिस्टर्ड Email दर्ज करें। हम OTP भेजेंगे।'
                    : 'अपना रजिस्टर्ड 10 अंकों का Phone Number दर्ज करें। हम OTP भेजेंगे।'
                  }
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    Boolean(resetError) && styles.inputError,
                  ]}
                  placeholder={
                    resetMethod === 'email'
                      ? 'example@gmail.com'
                      : '10 अंकों का मोबाइल नंबर'
                  }
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  keyboardType={
                    resetMethod === 'email' ? 'email-address' : 'number-pad'
                  }
                  maxLength={resetMethod === 'phone' ? 10 : undefined}
                  value={resetIdentifier}
                  onChangeText={(text) => {
                    setResetError('');
                    if (resetMethod === 'phone') {
                      setResetIdentifier(text.replace(/[^0-9]/g, ''));
                    } else {
                      setResetIdentifier(text);
                    }
                  }}
                />
                {Boolean(resetError) && (
                  <Text style={styles.errorText}>{resetError}</Text>
                )}

                <TouchableOpacity
                  style={[styles.signInButton, { marginTop: 14, marginBottom: 4 }]}
                  onPress={handleSendOtp}
                  disabled={resetLoading}
                >
                  <Text style={styles.signInButtonText}>
                    {resetLoading ? 'SENDING OTP...' : 'SEND OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  {resetIdentifier} के लिए भेजा गया 6 अंकों का OTP और नया पासवर्ड दर्ज करें।
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { marginBottom: 10 },
                    Boolean(resetError) && styles.inputError,
                  ]}
                  placeholder="6-Digit OTP"
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={resetOtp}
                  onChangeText={(t) => {
                    setResetError('');
                    setResetOtp(t.replace(/[^0-9]/g, ''));
                  }}
                />
                <TextInput
                  style={[
                    styles.input,
                    Boolean(resetError) && styles.inputError,
                  ]}
                  placeholder="नया पासवर्ड (कम से कम 6 अक्षर)"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={(t) => {
                    setResetError('');
                    setNewPassword(t);
                  }}
                />
                {Boolean(resetError) && (
                  <Text style={styles.errorText}>{resetError}</Text>
                )}

                <TouchableOpacity
                  style={[styles.signInButton, { marginTop: 14, marginBottom: 8 }]}
                  onPress={handleResetPasswordSubmit}
                  disabled={resetLoading}
                >
                  <Text style={styles.signInButtonText}>
                    {resetLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setResetError('');
                    setResetStep(1);
                  }}
                >
                  <Text style={styles.resendLink}>
                    Email / Phone बदलें या दोबारा OTP भेजें
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  appLogoText: {
    fontSize: 12,
    color: '#555',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
    color: '#111',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signInButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginHorizontal: 10,
  },
  orText: {
    color: '#666',
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerText: {
    color: '#666',
    fontSize: 13,
  },
  signUpText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  methodToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  methodTabActive: {
    backgroundColor: '#222',
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  methodTabTextActive: {
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#555',
    marginBottom: 12,
  },
  resendLink: {
    textAlign: 'center',
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
});