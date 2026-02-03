/**
 * Tasks Screen - Task List View
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB, useTheme, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { fetchTasks, setFilters, clearFilters } from '../../store/slices/tasksSlice';
import { openModal } from '../../store/slices/uiSlice';
import TaskCard from '../../components/TaskCard';

const CATEGORIES = [
  { value: null, label: 'Toutes' },
  { value: 'WORK', label: 'Travail' },
  { value: 'STUDY', label: 'Études' },
  { value: 'LEISURE', label: 'Loisirs' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'SOCIAL', label: 'Social' },
];

export default function TasksScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { tasks, isLoading, filters, pagination } = useSelector(state => state.tasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState('pending');

  const loadTasks = () => {
    dispatch(fetchTasks());
  };

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    dispatch(setFilters({ search: query }));
  };

  const handleCategoryFilter = (category) => {
    dispatch(setFilters({ category }));
  };

  const handleCompletedFilter = (value) => {
    setShowCompleted(value);
    dispatch(setFilters({
      completed: value === 'completed' ? true : value === 'pending' ? false : null,
    }));
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoading) {
      dispatch(fetchTasks({ page: pagination.page + 1, append: true }));
    }
  };

  const renderItem = ({ item }) => (
    <TaskCard
      task={item}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Aucune tâche
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {filters.completed === true
          ? 'Aucune tâche complétée'
          : 'Ajoute une nouvelle tâche pour commencer'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          Mes tâches
        </Text>
        <Chip icon="filter-variant">
          {pagination.total}
        </Chip>
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Rechercher une tâche..."
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchbar}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={showCompleted}
          onValueChange={handleCompletedFilter}
          buttons={[
            { value: 'pending', label: 'À faire' },
            { value: 'completed', label: 'Terminées' },
            { value: 'all', label: 'Toutes' },
          ]}
          style={styles.segmentedButtons}
        />

        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={filters.category === item.value}
              onPress={() => handleCategoryFilter(item.value)}
              style={styles.categoryChip}
              mode={filters.category === item.value ? 'flat' : 'outlined'}
            >
              {item.label}
            </Chip>
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadTasks} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => dispatch(openModal('createTask'))}
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
    paddingBottom: 8,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    paddingBottom: 8,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
