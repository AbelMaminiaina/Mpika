/**
 * Calendar Screen - Schedule View
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, FAB, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

import { fetchSchedule, optimizeSchedule, setCurrentDate } from '../../store/slices/scheduleSlice';
import ScheduleTimeline from '../../components/ScheduleTimeline';
import MentalLoadGauge from '../../components/MentalLoadGauge';

export default function CalendarScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { schedules, currentDate, mentalLoad, isLoading, isOptimizing } = useSelector(state => state.schedule);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentSchedule = schedules[format(selectedDate, 'yyyy-MM-dd')];

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    dispatch(fetchSchedule(dateStr));
    dispatch(setCurrentDate(dateStr));
  }, [selectedDate]);

  const handleOptimize = () => {
    dispatch(optimizeSchedule(format(selectedDate, 'yyyy-MM-dd')));
  };

  const renderWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());

      days.push(
        <Button
          key={i}
          mode={isSelected ? 'contained' : 'text'}
          compact
          onPress={() => setSelectedDate(day)}
          style={[
            styles.dayButton,
            isToday && !isSelected && { borderWidth: 1, borderColor: theme.colors.primary },
          ]}
          labelStyle={styles.dayButtonLabel}
        >
          <View style={styles.dayContent}>
            <Text
              variant="labelSmall"
              style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
            >
              {format(day, 'EEE', { locale: fr })}
            </Text>
            <Text
              variant="titleMedium"
              style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface }}
            >
              {format(day, 'd')}
            </Text>
          </View>
        </Button>
      );
    }

    return days;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {format(selectedDate, 'MMMM yyyy', { locale: fr })}
        </Text>
        <Button mode="text" onPress={() => setSelectedDate(new Date())}>
          Aujourd'hui
        </Button>
      </View>

      {/* Week Days */}
      <View style={styles.weekContainer}>
        {renderWeekDays()}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mental Load */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">Charge mentale</Text>
              <Button
                mode="contained-tonal"
                onPress={handleOptimize}
                loading={isOptimizing}
                icon="auto-fix"
              >
                Optimiser
              </Button>
            </View>
            <MentalLoadGauge score={mentalLoad.score || 0} size={120} />
          </Card.Content>
        </Card>

        {/* Schedule */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Planning du {format(selectedDate, 'd MMMM', { locale: fr })}
            </Text>

            {currentSchedule?.items?.length > 0 ? (
              <ScheduleTimeline
                items={currentSchedule.items}
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
        </Card>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {/* Open add schedule item modal */}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dayButton: {
    minWidth: 44,
    borderRadius: 12,
  },
  dayButtonLabel: {
    marginVertical: 4,
  },
  dayContent: {
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
