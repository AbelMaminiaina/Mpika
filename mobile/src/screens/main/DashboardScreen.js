/**
 * Dashboard Screen - Main Home Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, FAB, ProgressBar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { fetchSchedule, optimizeSchedule } from '../../store/slices/scheduleSlice';
import { fetchTasks } from '../../store/slices/tasksSlice';
import { fetchSummary } from '../../store/slices/analyticsSlice';
import { fetchSuggestions } from '../../store/slices/chatSlice';
import { openModal } from '../../store/slices/uiSlice';
import { getMentalLoadColor, getCategoryColor } from '../../utils/theme';
import MentalLoadGauge from '../../components/MentalLoadGauge';
import ScheduleTimeline from '../../components/ScheduleTimeline';
import TaskCard from '../../components/TaskCard';

export default function DashboardScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth);
  const { schedules, currentDate, mentalLoad, isLoading, isOptimizing } = useSelector(state => state.schedule);
  const { tasks } = useSelector(state => state.tasks);
  const { summary } = useSelector(state => state.analytics);
  const { suggestions } = useSelector(state => state.chat);

  const todaySchedule = schedules[currentDate];

  const loadData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await Promise.all([
      dispatch(fetchSchedule(today)),
      dispatch(fetchTasks({ completed: false, limit: 5 })),
      dispatch(fetchSummary()),
      dispatch(fetchSuggestions()),
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOptimize = () => {
    dispatch(optimizeSchedule(currentDate));
  };

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {formatGreeting()}, {user?.firstName}!
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {format(new Date(), "EEEE d MMMM", { locale: fr })}
            </Text>
          </View>
          <Button
            mode="contained-tonal"
            onPress={() => navigation.navigate('Analytics')}
            icon="chart-line"
          >
            Stats
          </Button>
        </View>

        {/* Mental Load Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.mentalLoadHeader}>
              <Text variant="titleMedium">Charge mentale</Text>
              <Chip
                mode="flat"
                style={{ backgroundColor: getMentalLoadColor(mentalLoad.level) + '20' }}
                textStyle={{ color: getMentalLoadColor(mentalLoad.level) }}
              >
                {mentalLoad.level === 'light' && 'Légère'}
                {mentalLoad.level === 'balanced' && 'Équilibrée'}
                {mentalLoad.level === 'busy' && 'Chargée'}
                {mentalLoad.level === 'overloaded' && 'Surchargée'}
                {mentalLoad.level === 'critical' && 'Critique'}
              </Chip>
            </View>

            <MentalLoadGauge score={mentalLoad.score} />

            {mentalLoad.score > 7 && (
              <View style={styles.warningBox}>
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  Ta journée semble chargée. Pense à prendre des pauses!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Today's Schedule */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">Planning du jour</Text>
              <Button
                mode="text"
                onPress={handleOptimize}
                loading={isOptimizing}
                icon="auto-fix"
              >
                Optimiser
              </Button>
            </View>

            {todaySchedule?.items?.length > 0 ? (
              <ScheduleTimeline
                items={todaySchedule.items.slice(0, 5)}
                onItemPress={(item) => {
                  if (item.taskId) {
                    navigation.navigate('TaskDetail', { taskId: item.taskId });
                  }
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Aucune activité planifiée
                </Text>
                <Button
                  mode="contained"
                  onPress={handleOptimize}
                  style={styles.emptyButton}
                  icon="calendar-plus"
                >
                  Générer un planning
                </Button>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Calendar')}>
              Voir tout
            </Button>
          </Card.Actions>
        </Card>

        {/* Tasks Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">Tâches à faire</Text>
              <Chip icon="checkbox-marked-circle">
                {summary?.overall?.pendingTasks || 0}
              </Chip>
            </View>

            {tasks.length > 0 ? (
              <View style={styles.tasksList}>
                {tasks.slice(0, 3).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact
                    onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Aucune tâche en attente
                </Text>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Tasks')}>
              Voir toutes les tâches
            </Button>
          </Card.Actions>
        </Card>

        {/* Quick Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Aujourd'hui
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                  {summary?.today?.tasksCompleted || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Complétées
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.secondary }}>
                  {summary?.today?.scheduledItems || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Planifiées
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.tertiary }}>
                  {summary?.week?.tasksCompleted || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Cette semaine
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Suggestions
              </Text>
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Text variant="bodyMedium">{suggestion.title}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {suggestion.message}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => dispatch(openModal('createTask'))}
        label="Nouvelle tâche"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  mentalLoadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
  tasksList: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  suggestionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
