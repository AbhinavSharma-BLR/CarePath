import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function MobileJourneyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Care Journey</Text>
        <Text style={styles.journeyId}>ID: CP-847291</Text>
      </View>

      {/* Completion Banner */}
      <View style={styles.completionBanner}>
        <Text style={styles.checkmark}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.completionTitle}>CARE JOURNEY COMPLETED</Text>
          <Text style={styles.completionSub}>
            All linked clinician referrals & follow-ups successfully finished.
          </Text>
        </View>
      </View>

      {/* Linked Referral Timeline */}
      <Text style={styles.sectionTitle}>Linked Referral Chain</Text>

      <View style={styles.timeline}>
        {/* Referral 1 */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineDotDone} />
          <View style={styles.timelineContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.referralTitle}>Referral 1: Cardiology OPD</Text>
              <Text style={styles.statusDone}>COMPLETED ✓</Text>
            </View>
            <Text style={styles.facilityName}>Rajiv Gandhi Govt General Hospital</Text>
            <Text style={styles.details}>Doctor: Dr. K. Rajesh • Code: REF-847291</Text>
            <Text style={styles.notes}>"Patient reported chest tightness. ECG reviewed, ST elevation noted."</Text>
          </View>
        </View>

        {/* Linking Line */}
        <View style={styles.timelineLine} />

        {/* Referral 2 (Cross-referral) */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineDotDone} />
          <View style={styles.timelineContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.referralTitle}>Referral 2: Neurology Evaluation</Text>
              <Text style={styles.statusDone}>COMPLETED ✓</Text>
            </View>
            <Text style={styles.facilityName}>Government Stanley Medical College</Text>
            <Text style={styles.details}>Linked from Referral 1 • Code: REF-902144</Text>
            <Text style={styles.notes}>"Cross-referred for neurological evaluation & MRI follow-up."</Text>
          </View>
        </View>
      </View>

      {/* Scheduled Follow-up Banner */}
      <View style={styles.followupCard}>
        <Text style={styles.followupTitle}>🗓️ Scheduled Follow-up</Text>
        <Text style={styles.followupDate}>September 15, 2026 • 10:30 AM</Text>
        <Text style={styles.followupLocation}>Cardiology OPD, Counter 4</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  journeyId: {
    fontSize: 14,
    fontFamily: 'Platform',
    fontWeight: 'bold',
    color: '#38BDF8',
    backgroundColor: '#0284C720',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completionBanner: {
    backgroundColor: '#05966920',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  completionSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineDotDone: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: '#334155',
    marginLeft: 7,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusDone: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34D399',
  },
  facilityName: {
    fontSize: 12,
    color: '#60A5FA',
    marginBottom: 2,
  },
  details: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
  },
  notes: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
  },
  followupCard: {
    backgroundColor: '#1E293B',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 30,
  },
  followupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBBF24',
    marginBottom: 4,
  },
  followupDate: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  followupLocation: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
