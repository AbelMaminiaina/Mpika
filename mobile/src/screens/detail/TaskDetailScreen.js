/**
 * Task Detail Screen
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card, Chip, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TaskDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const { taskId } = route.params;

  // TODO: Fetch task details

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall">Détail de la tâche</Text>
        <Text variant="bodyMedium">Task ID: {taskId}</Text>
        {/* TODO: Implement full task detail view */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
