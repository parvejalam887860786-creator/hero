import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TargetScreen() {
  const [completedLevel, setCompletedLevel] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const savedLevel = await AsyncStorage.getItem('completedLevel');
      const savedSubmitted = await AsyncStorage.getItem('isSubmitted');
      if (savedLevel !== null) setCompletedLevel(parseInt(savedLevel));
      if (savedSubmitted !== null) setIsSubmitted(savedSubmitted === 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const saveProgress = async (level: number, submitted: boolean) => {
    try {
      await AsyncStorage.setItem('completedLevel', level.toString());
      await AsyncStorage.setItem('isSubmitted', submitted.toString());
      
      if (submitted) {
        const historyData = {
          id: Date.now().toString(),
          title: 'All Targets',
          date: new Date().toLocaleDateString(),
          status: 'Completed',
        };
        const existingHistory = await AsyncStorage.getItem('targetHistory');
        const historyList = existingHistory ? JSON.parse(existingHistory) : [];
        historyList.push(historyData);
        await AsyncStorage.setItem('targetHistory', JSON.stringify(historyList));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTargetPress = (level: number) => {
    Alert.alert(
      "Verification Required",
      `Complete payment to unlock Target Books ${level}.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Pay & Unlock", 
          onPress: async () => {
            const newLevel = level;
            setCompletedLevel(newLevel);
            await saveProgress(newLevel, isSubmitted);
            Alert.alert("Success", `Target Books ${level} unlocked!`);
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    await saveProgress(completedLevel, true);
    Alert.alert("Submitted", "All targets processed successfully!");
  };

  const handleNewTarget = async () => {
    setCompletedLevel(0);
    setIsSubmitted(false);
    await saveProgress(0, false);
    Alert.alert("Reset", "Started a new target sequence.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TARGET</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {[1, 2, 3].map((level) => {
          const isUnlocked = level <= completedLevel + 1;
          const isDone = level <= completedLevel;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.button, !isUnlocked && styles.lockedButton]}
              onPress={() => handleTargetPress(level)}
              disabled={!isUnlocked || isDone}
            >
              <Text style={[styles.buttonText, !isUnlocked && styles.lockedText]}>
                Target Books {level}
              </Text>
              <Ionicons 
                name={isDone ? "checkmark-circle" : "lock-closed"} 
                size={22} 
                color={isDone ? "#4CAF50" : "#888"} 
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity 
          style={[styles.actionButton, styles.submitButton, (completedLevel < 3 || isSubmitted) && styles.lockedButton]}
          onPress={handleSubmit}
          disabled={completedLevel < 3 || isSubmitted}
        >
          <Text style={[styles.actionButtonText, (completedLevel < 3 || isSubmitted) && styles.lockedText]}>
            {isSubmitted ? "Submitted" : "Submit"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.newTargetButton, !isSubmitted && styles.lockedButton]}
          onPress={handleNewTarget}
          disabled={!isSubmitted}
        >
          <Text style={[styles.newTargetButtonText, !isSubmitted && styles.lockedText]}>New Target</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45, 
    paddingBottom: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E9ECEF' 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  placeholder: { width: 32 },
  content: { 
    flex: 1,
    justifyContent: 'center',
    padding: 20, 
    gap: 16 
  },
  button: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#007AFF' },
  lockedButton: { backgroundColor: '#E9ECEF', borderColor: '#CCC' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  lockedText: { color: '#888' },
  actionButton: { padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitButton: { backgroundColor: '#007AFF' },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  newTargetButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#007AFF' },
  newTargetButtonText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
});