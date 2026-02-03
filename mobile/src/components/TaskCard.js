/**
 * Task Card Component
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Checkbox, Chip } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { completeTask, uncompleteTask } from '../store/slices/tasksSlice';
import { getCategoryColor, getPriorityColor } from '../utils/theme';

export default function TaskCard({ task, compact = false, onPress }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const handleToggleComplete = () => {
    if (task.completed) {
      dispatch(uncompleteTask(task.id));
    } else {
      dispatch(completeTask(task.id));
    }
  };

  const categoryColor = getCategoryColor(task.category);
  const priorityColor = getPriorityColor(task.priority);

  const formatDeadline = () => {
    if (!task.deadline) return null;
    const date = new Date(task.deadline);
    const now = new Date();
    const isOverdue = date < now && !task.completed;

    return {
      text: format(date, 'd MMM', { locale: fr }),
      isOverdue,
    };
  };

  const deadline = formatDeadline();

  const getCategoryLabel = (category) => {
    const labels = {
      WORK: 'Travail',
      STUDY: 'Études',
      LEISURE: 'Loisirs',
      REST: 'Repos',
      SPORT: 'Sport',
      SOCIAL: 'Social',
      HOUSEHOLD: 'Maison',
      PERSONAL: 'Perso',
    };
    return labels[category] || category;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      LOW: 'Faible',
      MEDIUM: 'Moyenne',
      HIGH: 'Haute',
      URGENT: 'Urgente',
    };
    return labels[priority] || priority;
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: theme.colors.surface, borderLeftColor: categoryColor },
        ]}
        onPress={onPress}
      >
        <Checkbox
          status={task.completed ? 'checked' : 'unchecked'}
          onPress={handleToggleComplete}
          color={theme.colors.primary}
        />
        <View style={styles.compactContent}>
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={[
              { color: theme.colors.onSurface },
              task.completed && styles.completedText,
            ]}
          >
            {task.title}
          </Text>
          <View style={styles.compactMeta}>
            <Text variant="labelSmall" style={{ color: categoryColor }}>
              {getCategoryLabel(task.category)}
            </Text>
            {deadline && (
              <Text
                variant="labelSmall"
                style={{ color: deadline.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant }}
              >
                {deadline.text}
              </Text>
            )}
          </View>
        </View>
        {task.priority === 'HIGH' || task.priority === 'URGENT' ? (
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderLeftColor: categoryColor },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Checkbox
          status={task.completed ? 'checked' : 'unchecked'}
          onPress={handleToggleComplete}
          color={theme.colors.primary}
        />
        <View style={styles.headerContent}>
          <Text
            variant="titleMedium"
            numberOfLines={2}
            style={[
              { color: theme.colors.onSurface },
              task.completed && styles.completedText,
            ]}
          >
            {task.title}
          </Text>
        </View>
      </View>

      {task.description && (
        <Text
          variant="bodySmall"
          numberOfLines={2}
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {task.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.chips}>
          <Chip
            compact
            mode="flat"
            style={{ backgroundColor: categoryColor + '20' }}
            textStyle={{ color: categoryColor, fontSize: 11 }}
          >
            {getCategoryLabel(task.category)}
          </Chip>
          <Chip
            compact
            mode="flat"
            style={{ backgroundColor: priorityColor + '20' }}
            textStyle={{ color: priorityColor, fontSize: 11 }}
          >
            {getPriorityLabel(task.priority)}
          </Chip>
        </View>

        <View style={styles.meta}>
          {task.duration && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {task.duration} min
            </Text>
          )}
          {deadline && (
            <Text
              variant="labelSmall"
              style={{ color: deadline.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant }}
            >
              {deadline.isOverdue ? '⚠️ ' : ''}{deadline.text}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 4,
  },
  description: {
    marginLeft: 40,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: 40,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  compactContent: {
    flex: 1,
    marginLeft: 8,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
