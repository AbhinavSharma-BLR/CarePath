import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';

const mockFacilities = [
  {
    id: 'fac-1',
    name: 'Rajiv Gandhi Govt General Hospital',
    type: 'DISTRICT_HOSPITAL',
    distanceKm: 5.2,
    location: 'Park Town, Chennai, Tamil Nadu',
    specialties: ['Cardiology', 'Neurology', 'General Medicine'],
    isGovernment: true,
  },
  {
    id: 'fac-2',
    name: 'Apollo Hospital Greams Road',
    type: 'TERTIARY',
    distanceKm: 7.8,
    location: 'Thousands Lights, Chennai, Tamil Nadu',
    specialties: ['Cardiology', 'Cardiac Surgery', 'Oncology'],
    isGovernment: false,
  },
  {
    id: 'fac-3',
    name: 'Government Stanley Medical College',
    type: 'DISTRICT_HOSPITAL',
    distanceKm: 8.4,
    location: 'Royapuram, Chennai, Tamil Nadu',
    specialties: ['General Medicine', 'Pediatrics', 'Surgery'],
    isGovernment: true,
  },
  {
    id: 'fac-4',
    name: 'Primary Health Centre Vyasarpadi',
    type: 'PHC',
    distanceKm: 3.1,
    location: 'Vyasarpadi, Chennai, Tamil Nadu',
    specialties: ['General Medicine', 'Maternal Health'],
    isGovernment: true,
  },
];

export default function MobileFindCareScreen() {
  const [searchSpecialty, setSearchSpecialty] = useState('Cardiology');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Find Nearby Verified Care</Text>
      <Text style={styles.subtitle}>Verified hospitals and PHCs across India's network</Text>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchSpecialty}
          onChangeText={setSearchSpecialty}
          placeholder="Filter by specialty (e.g. Cardiology, Neurology)"
          placeholderTextColor="#64748B"
        />
      </View>

      {/* Facility List */}
      <View style={styles.facilityList}>
        {mockFacilities.map((fac) => (
          <View key={fac.id} style={styles.facilityCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.distanceBadge}>{fac.distanceKm} km away</Text>
              <Text style={fac.isGovernment ? styles.govBadge : styles.privateBadge}>
                {fac.isGovernment ? 'Government' : 'Private'}
              </Text>
            </View>

            <Text style={styles.facilityName}>{fac.name}</Text>
            <Text style={styles.facilityLocation}>{fac.location}</Text>

            <View style={styles.specialtiesRow}>
              {fac.specialties.map((s, idx) => (
                <View key={idx} style={styles.specChip}>
                  <Text style={styles.specText}>{s}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.requestButton}>
              <Text style={styles.requestButtonText}>Request Clinician Referral →</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  searchBox: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  facilityList: {
    gap: 14,
    paddingBottom: 30,
  },
  facilityCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38BDF8',
    backgroundColor: '#0284C720',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  govBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34D399',
    backgroundColor: '#05966920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  privateBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FBBF24',
    backgroundColor: '#D9770620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  facilityLocation: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  specChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specText: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  requestButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
