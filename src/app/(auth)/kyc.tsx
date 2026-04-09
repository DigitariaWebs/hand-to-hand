import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useAuthStore } from '@/stores/useAuthStore';

type Step = 0 | 1 | 2;

function StepIndicator({ step }: { step: Step }) {
  const labels = ['Identité', 'Selfie', 'Confirmation'];

  return (
    <View style={indicatorStyles.container}>
      <View style={indicatorStyles.row}>
        {labels.map((label, i) => {
          const isCompleted = i < step;
          const isActive = i === step;
          const dotColor = isCompleted
            ? '#10B981'
            : isActive
            ? Colors.light.primary
            : '#E5E7EB';
          const lineColor = i < step ? '#10B981' : '#E5E7EB';

          return (
            <React.Fragment key={i}>
              <View style={indicatorStyles.dotWrapper}>
                <View
                  style={[
                    indicatorStyles.dot,
                    { backgroundColor: dotColor },
                  ]}
                >
                  {isCompleted && (
                    <Feather name="check" size={10} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[
                    indicatorStyles.label,
                    isActive && { color: Colors.light.primary },
                    isCompleted && { color: '#10B981' },
                  ]}
                >
                  {label}
                </Text>
              </View>
              {i < labels.length - 1 && (
                <View
                  style={[
                    indicatorStyles.line,
                    { backgroundColor: lineColor },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotWrapper: {
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginBottom: 14,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
});

function UploadBox({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={uploadStyles.box}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name="upload" size={32} color={Colors.light.textSecondary} />
      <Text style={uploadStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const uploadStyles = StyleSheet.create({
  box: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D4C2FC',
    backgroundColor: '#F9F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
});

export default function KYCScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestKYC } = useAuthStore();
  const [step, setStep] = useState<Step>(0);

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((step - 1) as Step);
    }
  };

  const handleContinue = () => {
    setStep((step + 1) as Step);
  };

  const handleTerminer = async () => {
    await requestKYC();
    router.back();
  };

  const mockUpload = () => {
    Alert.alert('Télécharger un document', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Galerie', onPress: () => {} },
      { text: 'Caméra', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <StepIndicator step={step} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View>
            <Text style={styles.title}>Pièce d'identité</Text>
            <Text style={styles.subtitle}>
              Recto et verso de votre carte d'identité ou passeport
            </Text>

            <View style={styles.uploadContainer}>
              <UploadBox label="Recto" onPress={mockUpload} />
            </View>
            <View style={styles.uploadContainerSmall}>
              <UploadBox label="Verso" onPress={mockUpload} />
            </View>

            <Button
              label="Continuer"
              onPress={handleContinue}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Selfie de vérification</Text>
            <Text style={styles.subtitle}>
              Prenez un selfie clair, visage dégagé et bien éclairé
            </Text>

            <View style={styles.selfieContainer}>
              <TouchableOpacity
                style={styles.selfieCircle}
                onPress={mockUpload}
                activeOpacity={0.7}
              >
                <Feather name="camera" size={36} color={Colors.light.textSecondary} />
                <Text style={styles.selfieLabel}>Selfie</Text>
              </TouchableOpacity>
            </View>

            <Button
              label="Continuer"
              onPress={handleContinue}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Documents soumis</Text>
            <Text style={styles.subtitle}>
              Votre dossier est en cours de vérification
            </Text>

            <View style={styles.statusPillContainer}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>En cours de vérification</Text>
              </View>
            </View>

            <Text style={styles.infoText}>
              Vous recevrez une notification une fois votre identité vérifiée. Cela prend généralement 24-48 heures.
            </Text>

            <Button
              label="Terminer"
              onPress={handleTerminer}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: Colors.light.text,
    marginTop: 32,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  uploadContainer: {
    marginTop: 24,
  },
  uploadContainerSmall: {
    marginTop: 12,
  },
  actionButton: {
    marginTop: 32,
  },
  selfieContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  selfieCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D4C2FC',
    backgroundColor: '#F9F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  statusPillContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  statusPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
