/**
 * Profile Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, useTheme, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '../../store/slices/authSlice';
import { fetchProfile } from '../../store/slices/profileSlice';

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.profile);

  useEffect(() => {
    dispatch(fetchProfile());
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const getEnergyLabel = (energy) => {
    switch (energy) {
      case 'morning': return 'Matin';
      case 'afternoon': return 'Après-midi';
      case 'evening': return 'Soir';
      default: return energy;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.onSurface }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.email}
          </Text>
        </View>

        {/* Profile Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Préférences de planning
            </Text>

            <List.Item
              title="Heures de sommeil"
              description={`${profile?.sleepHours || 8} heures`}
              left={props => <List.Icon {...props} icon="sleep" />}
            />
            <Divider />

            <List.Item
              title="Heure de réveil"
              description={profile?.wakeUpTime || '07:00'}
              left={props => <List.Icon {...props} icon="weather-sunny" />}
            />
            <Divider />

            <List.Item
              title="Heure de coucher"
              description={profile?.bedTime || '23:00'}
              left={props => <List.Icon {...props} icon="weather-night" />}
            />
            <Divider />

            <List.Item
              title="Pic d'énergie"
              description={getEnergyLabel(profile?.energyPeakTime)}
              left={props => <List.Icon {...props} icon="lightning-bolt" />}
            />
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Settings')}>
              Modifier
            </Button>
          </Card.Actions>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Notifications
            </Text>

            <List.Item
              title="Notifications activées"
              description={profile?.notificationsEnabled ? 'Oui' : 'Non'}
              left={props => <List.Icon {...props} icon="bell" />}
            />
            <Divider />

            <List.Item
              title="Rappels de tâches"
              description={`${profile?.reminderMinutes || 30} minutes avant`}
              left={props => <List.Icon {...props} icon="clock-alert" />}
            />
            <Divider />

            <List.Item
              title="Rappels de pause"
              description={profile?.pauseReminders ? 'Activés' : 'Désactivés'}
              left={props => <List.Icon {...props} icon="coffee" />}
            />
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Application
            </Text>

            <List.Item
              title="Langue"
              description={profile?.preferredLanguage === 'fr' ? 'Français' : 'English'}
              left={props => <List.Icon {...props} icon="translate" />}
              onPress={() => {}}
            />
            <Divider />

            <List.Item
              title="Thème"
              description={profile?.theme === 'light' ? 'Clair' : profile?.theme === 'dark' ? 'Sombre' : 'Système'}
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
              onPress={() => {}}
            />
            <Divider />

            <List.Item
              title="Fuseau horaire"
              description={profile?.timezone || 'Europe/Paris'}
              left={props => <List.Icon {...props} icon="earth" />}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Statistiques"
              description="Voir mes statistiques détaillées"
              left={props => <List.Icon {...props} icon="chart-line" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Analytics')}
            />
            <Divider />

            <List.Item
              title="Paramètres"
              description="Configurer l'application"
              left={props => <List.Icon {...props} icon="cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Settings')}
            />
          </Card.Content>
        </Card>

        {/* Logout */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
          textColor={theme.colors.error}
        >
          Se déconnecter
        </Button>

        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
          Mpikarakara v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    marginTop: 16,
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: 'transparent',
  },
  version: {
    textAlign: 'center',
    marginTop: 24,
  },
});
