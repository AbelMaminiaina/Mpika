/**
 * Schedule Timeline Component
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { getCategoryColor } from '../utils/theme';

export default function ScheduleTimeline({ items = [], onItemPress }) {
  const theme = useTheme();

  const getTypeColor = (item) => {
    if (item.type === 'BREAK') return theme.colors.tertiary;
    if (item.type === 'BUFFER') return theme.colors.outline;
    if (item.type === 'LUNCH') return theme.colors.secondary;
    if (item.task) return getCategoryColor(item.task.category);
    return theme.colors.primary;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'BREAK': return 'Pause';
      case 'BUFFER': return 'Transition';
      case 'LUNCH': return 'Déjeuner';
      default: return 'Tâche';
    }
  };

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const color = getTypeColor(item);
        const startTime = format(new Date(item.startTime), 'HH:mm');
        const endTime = format(new Date(item.endTime), 'HH:mm');

        return (
          <TouchableOpacity
            key={item.id || index}
            style={styles.itemContainer}
            onPress={() => onItemPress?.(item)}
            disabled={!onItemPress || item.type === 'BUFFER'}
          >
            {/* Timeline */}
            <View style={styles.timeline}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {index < items.length - 1 && (
                <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
              )}
            </View>

            {/* Content */}
            <View style={[styles.content, { borderLeftColor: color }]}>
              <View style={styles.timeRow}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {startTime} - {endTime}
                </Text>
                {item.type !== 'TASK' && (
                  <Text variant="labelSmall" style={{ color }}>
                    {getTypeLabel(item.type)}
                  </Text>
                )}
              </View>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.task && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.task.category}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});
