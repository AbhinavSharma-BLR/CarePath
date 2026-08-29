import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

const assistanceTypes = [
  { id: 'HOSPITAL_NAVIGATION', label: 'Hospital Navigation', icon: '🧭' },
  { id: 'DIRECTIONS', label: 'OPD Directions', icon: '📍' },
  { id: 'TRANSPORT_INFO', label: 'Transport / Wheelchair', icon: '♿' },
  { id: 'APPOINTMENT_ASSISTANCE', label: 'Appointment Help', icon: '🗓️' },
  { id: 'LANGUAGE_ASSISTANCE', label: 'Language Translator', icon: '🗣️' },
];

export default function MobileAssistanceScreen() {
  const [selectedType, setSelectedType] = useState('HOSPITAL_NAVIGATION');
  const [notes, setNotes] = useState('First time visiting Rajiv Gandhi Govt Hospital. Need help reaching Cardiology OPD.');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>CARELINK Assistance</Text>
      <Text style={styles.subtitle}>Practical help along your healthcare journey</Text>

      {requestSubmitted ? (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Assistance Request Active</Text>
          <Text style={styles.successSub}>
            Navigator <Text style={{ color: '#FBBF24', fontWeight: 'bold' }}>Anitha Ramesh</Text> has been assigned to assist you.
          </Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Assigned Navigator Contact</Text>
            <Text style={styles.contactName}>Anitha Ramesh (CARELINK Desk)</Text>
            <Text style={styles.contactPhone}>📞 9876543212</Text>
          </View>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Select Type of Assistance Needed</Text>
          <View style={styles.typeGrid}>
            {assistanceTypes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.typeChip, selectedType === item.id && styles.typeChipSelected]}
                onPress={() => setSelectedType(item.id)}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text style={selectedType === item.id ? styles.typeTextSelected : styles.typeText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Additional Notes or Request Details</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="Explain where you are or what help you need..."
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity style={styles.submitButton} onPress={() => setRequestSubmitted(true)}>
            <Text style={styles.submitButtonText}>Request CARELINK Navigator</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 12,
  },
  typeGrid: {
    gap: 10,
    marginBottom: 20,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  typeChipSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#D9770620',
  },
  typeIcon: {
    fontSize: 18,
  },
  typeText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  typeTextSelected: {
    fontSize: 13,
    color: '#FBBF24',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successCard: {
    backgroundColor: '#1E293B',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 36,
    color: '#FBBF24',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '600',
  },
});
