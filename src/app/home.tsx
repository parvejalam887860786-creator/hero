import React from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* सर्च बार */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput placeholder="Search..." placeholderTextColor="#888" style={styles.searchInput} />
        </View>
      </View>

      {/* मुख्य कंटेंट */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* वीडियो प्लेयर */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoPlaceholderText}>▶️</Text>
        </View>

        {/* डिस्क्रिप्शन */}
        <Text style={styles.sectionHeader}>Descriptions</Text>
        <Text style={styles.bodyText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Text>

        {/* वार्निंग */}
        <View style={styles.warningBox}>
          <Text style={styles.warningHeader}>⚠️ Warning:</Text>
          <Text style={styles.warningText}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
          </Text>
        </View>

        {/* नोट्स */}
        <Text style={styles.sectionHeader}>Note:</Text>
        <Text style={styles.bodyText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
        </Text>
      </ScrollView>

      {/* बॉटम नेविगेशन Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.replace('/profile' as never)}
        >
          <Ionicons name="person-outline" size={24} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, styles.activeNavItem]} 
          onPress={() => router.replace('/target' as never)}
        >
          <View style={styles.activeIconCircle}>
            <Ionicons name="locate" size={28} color="#FFF" />
          </View>
          <Text style={[styles.navText, styles.activeNavText]}>Target</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.replace('/history' as never)}
        >
          <Ionicons name="time-outline" size={24} color="#555" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.replace('/settings' as never)}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },
  scrollContent: {
    padding: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#212529',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 48,
    opacity: 0.8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginTop: 12,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#FFF9DB',
    borderLeftWidth: 4,
    borderLeftColor: '#FCC419',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  warningHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#922B21',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#78281f',
    lineHeight: 20,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  activeNavItem: {
    marginTop: -15,
  },
  activeIconCircle: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginTop: 4,
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: '700',
  },
});