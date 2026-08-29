import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function MobileLoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const handleSendOTP = () => {
    setStep('OTP');
  };

  const handleVerify = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>CP</Text>
          </View>
          <Text style={styles.title}>CAREPATH</Text>
          <Text style={styles.subtitle}>Patient Digital Healthcare Layer</Text>
        </View>

        {step === 'PHONE' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="9876543210"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
              <Text style={styles.buttonText}>Get Verification OTP</Text>
            </TouchableOpacity>

            <View style={styles.demoNote}>
              <Text style={styles.demoNoteText}>Demo Account: Abhinav Sharma (20, Male)</Text>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter 6-Digit Verification Code</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholder="123456"
              maxLength={6}
              placeholderTextColor="#64748B"
            />
            <Text style={styles.hint}>Default demo OTP: 123456</Text>

            <TouchableOpacity style={styles.button} onPress={handleVerify}>
              <Text style={styles.buttonText}>Verify & Access App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => setStep('PHONE')}>
              <Text style={styles.linkText}>← Change phone number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  form: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#60A5FA',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  demoNote: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
  },
  demoNoteText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '500',
  },
});
