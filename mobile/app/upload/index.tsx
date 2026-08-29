import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function MobileUploadScreen() {
  const [reportType, setReportType] = useState('ECG');
  const [uploading, setUploading] = useState(false);
  const [processedSummary, setProcessedSummary] = useState<any | null>(null);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setProcessedSummary({
        summary:
          'The report shows Sinus Rhythm with a Heart Rate of 78 bpm. ST segment values indicate mild elevation in Lead II. ⚠️ outside normal range.',
        keyValues: [
          { name: 'Heart Rate', value: '78', unit: 'bpm', isAbnormal: false },
          { name: 'ST Lead II', value: '+1.5', unit: 'mm', isAbnormal: true },
        ],
        disclaimer: 'This is an automatically generated summary and is not a medical diagnosis.',
      });
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Medical Document</Text>
      <Text style={styles.subtitle}>AI automatically extracts & summarizes reports into plain language</Text>

      {/* Select Report Type */}
      <View style={styles.card}>
        <Text style={styles.label}>Select Report Category</Text>
        <View style={styles.typeRow}>
          {['ECG', 'BLOOD_REPORT', 'XRAY', 'PRESCRIPTION'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, reportType === type && styles.typeBtnActive]}
              onPress={() => setReportType(type)}
            >
              <Text style={reportType === type ? styles.typeTextActive : styles.typeText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upload Action Box */}
        <TouchableOpacity style={styles.dropZone} onPress={handleUpload} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : (
            <>
              <Text style={styles.uploadIcon}>📥</Text>
              <Text style={styles.uploadTitle}>Tap to select file / take photo</Text>
              <Text style={styles.uploadSub}>Supports PDF, JPG, PNG up to 10MB</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Processed Summary */}
      {processedSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryBadge}>AI SUMMARY GENERATED</Text>
          </View>
          <Text style={styles.summaryText}>{processedSummary.summary}</Text>

          {/* Key values table */}
          <Text style={styles.kvHeader}>Extracted Clinical Values</Text>
          {processedSummary.keyValues.map((kv: any, idx: number) => (
            <View key={idx} style={styles.kvRow}>
              <Text style={styles.kvName}>{kv.name}</Text>
              <Text style={kv.isAbnormal ? styles.kvAbnormal : styles.kvNormal}>
                {kv.value} {kv.unit} {kv.isAbnormal && '⚠️'}
              </Text>
            </View>
          ))}

          <Text style={styles.disclaimer}>{processedSummary.disclaimer}</Text>
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
  card: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB20',
  },
  typeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  typeTextActive: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: 'bold',
  },
  dropZone: {
    borderColor: '#2563EB',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A50',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  uploadSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 30,
  },
  summaryHeader: {
    marginBottom: 10,
  },
  summaryBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34D399',
  },
  summaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 14,
  },
  kvHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 8,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  kvName: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  kvNormal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  kvAbnormal: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 12,
  },
});
