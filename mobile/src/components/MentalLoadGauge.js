/**
 * Mental Load Gauge Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, G } from 'react-native-svg';
import { getMentalLoadColor } from '../utils/theme';

export default function MentalLoadGauge({ score = 0, size = 150 }) {
  const theme = useTheme();

  const radius = (size - 20) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score / 10, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const level = getLevel(score);
  const color = getMentalLoadColor(level);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surfaceVariant}
            strokeWidth={12}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={12}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <View style={styles.textContainer}>
        <Text variant="displaySmall" style={[styles.scoreText, { color }]}>
          {score.toFixed(1)}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          / 10
        </Text>
      </View>
    </View>
  );
}

function getLevel(score) {
  if (score <= 3) return 'light';
  if (score <= 5) return 'balanced';
  if (score <= 7) return 'busy';
  if (score <= 9) return 'overloaded';
  return 'critical';
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
  },
});
