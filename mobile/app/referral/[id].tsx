import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function MobileReferralDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const referralCode = typeof id === 'string' ? id : 'REF-847291';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>HOSPITAL RECEPTION QR CODE</Text>
          <View style={styles.qrBox}>
            <QRCode value={referralCode} size={180} backgroundColor="#FFFFFF" color="#0F172A" />
          </View>
          <Text style={styles.qrCodeText}>{referralCode}</Text>
          <Text style={styles.qrSub}>Show this QR code at hospital reception to check-in</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Care Journey ID</Text>
            <Text style={styles.infoValueBlue}>CP-847291</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Specialty</Text>
            <Text style={styles.infoValue}>Cardiology OPD</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Facility</Text>
            <Text style={styles.infoValue}>Rajiv Gandhi Govt General Hospital</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Clinician Doctor</Text>
            <Text style={styles.infoValue}>Dr. K. Rajesh (Cardiology)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>OPD Location</Text>
            <Text style={styles.infoValueGreen}>Block B, 2nd Floor, Counter 4</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.statusBadge}>PATIENT ARRIVED ✓</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.carelinkBtn} onPress={() => router.push('/(tabs)/assistance')}>
          <Text style={styles.carelinkBtnText}>🧭 Request CARELINK Hospital Navigator</Text>
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  qrLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#60A5FA',
    letterSpacing: 1,
    marginBottom: 16,
  },
  qrBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  qrCodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Platform',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  qrSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoValueBlue: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: 'bold',
    fontFamily: 'Platform',
  },
  infoValueGreen: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: 'bold',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34D399',
    backgroundColor: '#05966920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  carelinkBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  carelinkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
