/**
 * Notifications Service - Push Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initialize notifications and get push token
 */
export async function initializeNotifications() {
  let token = null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permission');
    return null;
  }

  // Get push token
  try {
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Task and schedule reminders',
    });

    await Notifications.setNotificationChannelAsync('breaks', {
      name: 'Break Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Reminders to take breaks',
    });
  }

  return token;
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification({
  title,
  body,
  data = {},
  trigger,
  channelId = 'default',
}) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger,
  });

  return id;
}

/**
 * Schedule a task reminder
 */
export async function scheduleTaskReminder(task, minutesBefore = 30) {
  if (!task.deadline) return null;

  const triggerDate = new Date(task.deadline);
  triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);

  // Don't schedule if time has passed
  if (triggerDate <= new Date()) return null;

  return scheduleNotification({
    title: `Rappel: ${task.title}`,
    body: `Cette tâche est prévue dans ${minutesBefore} minutes`,
    data: { taskId: task.id, type: 'task_reminder' },
    trigger: { date: triggerDate },
    channelId: 'reminders',
  });
}

/**
 * Schedule a break reminder
 */
export async function scheduleBreakReminder(scheduleItem) {
  const breakTime = new Date(scheduleItem.startTime);

  // Don't schedule if time has passed
  if (breakTime <= new Date()) return null;

  return scheduleNotification({
    title: 'Temps de pause!',
    body: 'Prends quelques minutes pour te reposer et te détendre.',
    data: { type: 'break_reminder' },
    trigger: { date: breakTime },
    channelId: 'breaks',
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Add notification listener
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}
