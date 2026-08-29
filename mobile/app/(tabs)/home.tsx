import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function MobileHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.patientName}>Abhinav Sharma (20, Male)</Text>
        </View>
        <View style={styles.abhaBadge}>
          <Text style={styles.abhaText}>ABHA Verified</Text>
        </View>
      </View>

      {/* Active Journey Banner */}
      <View style={styles.journeyCard}>
        <View style={styles.journeyHeader}>
          <Text style={styles.journeyTag}>ACTIVE CARE JOURNEY</Text>
          <Text style={styles.journeyId}>CP-847291</Text>
        </View>
        <Text style={styles.journeyTitle}>Cardiology & Neurological Care Continuity</Text>
        <Text style={styles.journeySub}>2 Linked Referrals • Rajiv Gandhi Govt Hospital</Text>

        <TouchableOpacity style={styles.viewJourneyButton} onPress={() => router.push('/(tabs)/journey')}>
          <Text style={styles.viewJourneyText}>View Complete Journey Tree →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/upload')}>
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionLabel}>Upload Report</Text>
          <Text style={styles.actionSub}>ECG, Blood, X-Ray</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/find-care')}>
          <Text style={styles.actionIcon}>🏥</Text>
          <Text style={styles.actionLabel}>Find Care</Text>
          <Text style={styles.actionSub}>Nearby Hospitals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/assistance')}>
          <Text style={styles.actionIcon}>🧭</Text>
          <Text style={styles.actionLabel}>CARELINK</Text>
          <Text style={styles.actionSub}>Hospital Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/referral/REF-847291')}>
          <Text style={styles.actionIcon}>📲</Text>
          <Text style={styles.actionLabel}>Show QR Code</Text>
          <Text style={styles.actionSub}>Arrival Scanner</Text>
        </TouchableOpacity>
      </View>

      {/* AI AI-Generated Plain Language Summary Banner */}
      <View style={styles.aiSummaryCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiBadge}>AI REPORT SUMMARY</Text>
          <Text style={styles.aiDate}>Today</Text>
        </View>
        <Text style={styles.aiText}>
          "The report shows Sinus Rhythm with a Heart Rate of 78 bpm. ST segment values indicate mild elevation in Lead II. ⚠️ outside normal range."
        </Text>
        <Text style={styles.aiDisclaimer}>
          This is an automatically generated summary and is not a medical diagnosis.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: '#94A3B8',
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  abhaBadge: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  abhaText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  journeyCard: {
    backgroundColor: '#1E293B',
    borderColor: '#2563EB',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journeyTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#60A5FA',
    letterSpacing: 1,
  },
  journeyId: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Platform',
    color: '#38BDF8',
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  journeySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
  },
  viewJourneyButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewJourneyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  aiSummaryCard: {
    backgroundColor: '#0284C715',
    borderColor: '#0284C740',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  aiDate: {
    fontSize: 11,
    color: '#64748B',
  },
  aiText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 8,
  },
  aiDisclaimer: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
