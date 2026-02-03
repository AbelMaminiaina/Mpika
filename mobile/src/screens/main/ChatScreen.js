/**
 * Chat Screen - AI Assistant
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton, useTheme, Card, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';

import { sendMessage, addOptimisticMessage, clearMessages } from '../../store/slices/chatSlice';

export default function ChatScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const flatListRef = useRef(null);

  const { messages, currentConversation, isSending, suggestions } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Start with a welcome message if no conversation
    if (messages.length === 0) {
      // Could add initial assistant message here
    }
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');

    // Add optimistic message
    dispatch(addOptimisticMessage(messageText));

    // Send to API
    await dispatch(sendMessage({
      message: messageText,
      conversationId: currentConversation?.id,
    }));

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion.message || suggestion.title);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'USER';

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={{ color: isUser ? theme.colors.onPrimary : theme.colors.onSurface }}
          >
            {item.content}
          </Text>
          <Text
            variant="labelSmall"
            style={[
              styles.timestamp,
              { color: isUser ? theme.colors.onPrimary + '80' : theme.colors.onSurfaceVariant },
            ]}
          >
            {format(new Date(item.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={{ color: theme.colors.primary, marginBottom: 8 }}>
        Bonjour {user?.firstName}!
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        Je suis Mpikarakara, ton assistant de gestion du temps.{'\n'}
        Comment puis-je t'aider aujourd'hui?
      </Text>

      <View style={styles.quickActions}>
        <Card
          style={styles.quickActionCard}
          onPress={() => setInputText('Comment va ma charge mentale aujourd\'hui ?')}
        >
          <Card.Content>
            <Text variant="labelLarge">Charge mentale</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Voir mon état actuel
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={styles.quickActionCard}
          onPress={() => setInputText('Peux-tu optimiser mon planning de demain ?')}
        >
          <Card.Content>
            <Text variant="labelLarge">Optimiser planning</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Réorganiser mes tâches
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={styles.quickActionCard}
          onPress={() => setInputText('Quelles sont mes tâches prioritaires ?')}
        >
          <Card.Content>
            <Text variant="labelLarge">Priorités</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Voir mes tâches urgentes
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={styles.quickActionCard}
          onPress={() => setInputText('Donne-moi des conseils de productivité')}
        >
          <Card.Content>
            <Text variant="labelLarge">Conseils</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Améliorer ma productivité
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          Assistant
        </Text>
        {currentConversation && (
          <IconButton
            icon="refresh"
            onPress={() => dispatch(clearMessages())}
          />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing indicator */}
        {isSending && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>
              Mpikarakara réfléchit...
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Écris ton message..."
            mode="outlined"
            style={styles.input}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 8,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  timestamp: {
    marginTop: 4,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    gap: 12,
  },
  quickActionCard: {
    width: '45%',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    maxHeight: 100,
  },
});
