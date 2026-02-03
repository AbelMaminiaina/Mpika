/**
 * Onboarding Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, SegmentedButtons, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/profileSlice';
import Slider from '@react-native-community/slider';

export default function OnboardingScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    sleepHours: 8,
    wakeUpTime: '07:00',
    bedTime: '23:00',
    energyPeakTime: 'morning',
  });

  const steps = [
    {
      title: 'Bienvenue!',
      description: 'Mpikarakara va t\'aider à organiser ton temps de manière équilibrée et à réduire ta charge mentale.',
    },
    {
      title: 'Ton sommeil',
      description: 'Combien d\'heures de sommeil te faut-il pour te sentir en forme ?',
      component: (
        <View style={styles.stepContent}>
          <Text variant="displaySmall" style={[styles.sleepValue, { color: theme.colors.primary }]}>
            {profile.sleepHours}h
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={4}
            maximumValue={12}
            step={1}
            value={profile.sleepHours}
            onValueChange={(value) => setProfile(p => ({ ...p, sleepHours: value }))}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.outline}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text variant="bodySmall">4h</Text>
            <Text variant="bodySmall">12h</Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Ton énergie',
      description: 'À quel moment de la journée te sens-tu le plus productif ?',
      component: (
        <View style={styles.stepContent}>
          <SegmentedButtons
            value={profile.energyPeakTime}
            onValueChange={(value) => setProfile(p => ({ ...p, energyPeakTime: value }))}
            buttons={[
              { value: 'morning', label: 'Matin' },
              { value: 'afternoon', label: 'Après-midi' },
              { value: 'evening', label: 'Soir' },
            ]}
          />
          <View style={styles.energyDescription}>
            {profile.energyPeakTime === 'morning' && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tu es un lève-tôt ! Les tâches importantes seront planifiées le matin.
              </Text>
            )}
            {profile.energyPeakTime === 'afternoon' && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tu atteins ton pic d'énergie l'après-midi. Parfait pour les tâches complexes.
              </Text>
            )}
            {profile.energyPeakTime === 'evening' && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tu es un oiseau de nuit ! Les tâches importantes seront en fin de journée.
              </Text>
            )}
          </View>
        </View>
      ),
    },
    {
      title: 'C\'est parti!',
      description: 'Tu es prêt(e) à commencer. Mpikarakara va t\'aider à :\n\n• Organiser tes tâches intelligemment\n• Équilibrer travail et repos\n• Éviter la surcharge mentale\n• Atteindre tes objectifs sereinement',
    },
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Save profile and finish onboarding
      await dispatch(updateProfile(profile));
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = steps[step];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progress}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= step ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {currentStep.title}
          </Text>
          <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {currentStep.description}
          </Text>

          {currentStep.component}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 0 && (
            <Button mode="outlined" onPress={handleBack} style={styles.navButton}>
              Retour
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleNext}
            style={[styles.navButton, step === 0 && styles.fullWidth]}
          >
            {step === steps.length - 1 ? 'Commencer' : 'Suivant'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  stepContent: {
    width: '100%',
    marginTop: 24,
  },
  sleepValue: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  energyDescription: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  navButton: {
    flex: 1,
  },
  fullWidth: {
    flex: 1,
  },
});
