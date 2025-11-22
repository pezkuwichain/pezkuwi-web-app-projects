import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { usePolkadot } from '../contexts/PolkadotContext';
import { submitKycApplication, uploadToIPFS } from '@pezkuwi/lib/citizenship-workflow';
import AppColors, { KurdistanColors } from '../theme/colors';

const BeCitizenScreen: React.FC = () => {
  const { t } = useTranslation();
  const { api, selectedAccount } = usePolkadot();
  const [isExistingCitizen, setIsExistingCitizen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'choice' | 'new' | 'existing'>('choice');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Citizen Form State
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [tribe, setTribe] = useState('');
  const [region, setRegion] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Existing Citizen Login State
  const [citizenId, setCitizenId] = useState('');
  const [password, setPassword] = useState('');

  const handleNewCitizenApplication = async () => {
    if (!fullName || !fatherName || !motherName || !email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!api || !selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare citizenship data
      const citizenshipData = {
        fullName,
        fatherName,
        motherName,
        tribe,
        region,
        email,
        profession,
        referralCode,
        walletAddress: selectedAccount.address,
        timestamp: Date.now(),
      };

      // Step 1: Upload encrypted data to IPFS
      const ipfsCid = await uploadToIPFS(citizenshipData);

      if (!ipfsCid) {
        throw new Error('Failed to upload data to IPFS');
      }

      // Step 2: Submit KYC application to blockchain
      const result = await submitKycApplication(
        api,
        selectedAccount,
        fullName,
        email,
        ipfsCid,
        'Citizenship application via mobile app'
      );

      if (result.success) {
        Alert.alert(
          'Application Submitted!',
          'Your citizenship application has been submitted for review. You will receive a confirmation once approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFullName('');
                setFatherName('');
                setMotherName('');
                setTribe('');
                setRegion('');
                setEmail('');
                setProfession('');
                setReferralCode('');
                setCurrentStep('choice');
              },
            },
          ]
        );
      } else {
        Alert.alert('Application Failed', result.error || 'Failed to submit application');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Citizenship application error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingCitizenLogin = () => {
    if (!citizenId || !password) {
      Alert.alert('Error', 'Please enter Citizen ID and Password');
      return;
    }

    // TODO: Implement actual citizenship verification
    Alert.alert('Success', 'Welcome back, Citizen!', [
      {
        text: 'OK',
        onPress: () => {
          setCitizenId('');
          setPassword('');
          setCurrentStep('choice');
        },
      },
    ]);
  };

  if (currentStep === 'choice') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[KurdistanColors.kesk, KurdistanColors.zer, KurdistanColors.sor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>🏛️</Text>
              </View>
              <Text style={styles.title}>Be a Citizen</Text>
              <Text style={styles.subtitle}>
                Join the Pezkuwi decentralized nation
              </Text>
            </View>

            <View style={styles.choiceContainer}>
              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => setCurrentStep('new')}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceIcon}>📝</Text>
                <Text style={styles.choiceTitle}>New Citizen</Text>
                <Text style={styles.choiceDescription}>
                  Apply for citizenship and join our community
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => setCurrentStep('existing')}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceIcon}>🔐</Text>
                <Text style={styles.choiceTitle}>Existing Citizen</Text>
                <Text style={styles.choiceDescription}>
                  Access your citizenship account
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Citizenship Benefits</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Voting rights in governance</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Access to exclusive services</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Referral rewards program</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Community recognition</Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (currentStep === 'new') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep('choice')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>New Citizen Application</Text>
          <Text style={styles.formSubtitle}>
            Please provide your information to apply for citizenship
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Father's Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter father's name"
              value={fatherName}
              onChangeText={setFatherName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mother's Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter mother's name"
              value={motherName}
              onChangeText={setMotherName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tribe</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter tribe (optional)"
              value={tribe}
              onChangeText={setTribe}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Region</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter region (optional)"
              value={region}
              onChangeText={setRegion}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profession</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter profession (optional)"
              value={profession}
              onChangeText={setProfession}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Referral Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code (optional)"
              value={referralCode}
              onChangeText={setReferralCode}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleNewCitizenApplication}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={KurdistanColors.spi} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Existing Citizen Login
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep('choice')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>Citizen Login</Text>
        <Text style={styles.formSubtitle}>
          Access your citizenship account
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Citizen ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Citizen ID"
            value={citizenId}
            onChangeText={setCitizenId}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleExistingCitizenLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: KurdistanColors.spi,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: KurdistanColors.spi,
    textAlign: 'center',
    opacity: 0.9,
  },
  choiceContainer: {
    gap: 16,
    marginBottom: 40,
  },
  choiceCard: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  choiceIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
    marginBottom: 8,
  },
  choiceDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KurdistanColors.spi,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 16,
    color: KurdistanColors.spi,
    marginRight: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 14,
    color: KurdistanColors.spi,
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: KurdistanColors.kesk,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KurdistanColors.reş,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 8,
  },
  input: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: KurdistanColors.kesk,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
  },
  spacer: {
    height: 40,
  },
});

export default BeCitizenScreen;
