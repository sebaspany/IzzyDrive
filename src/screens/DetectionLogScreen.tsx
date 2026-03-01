import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { DetectionLogEntry } from '../types';
import { COLORS } from '../constants/defaults';
import { loadDetectionLog, clearDetectionLog } from '../utils/storage';

interface DetectionLogScreenProps {
  onBack: () => void;
}

export default function DetectionLogScreen({ onBack }: DetectionLogScreenProps) {
  const [log, setLog] = useState<DetectionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const entries = await loadDetectionLog();
    setLog(entries.reverse()); // Most recent first
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleClear = () => {
    Alert.alert(
      'Clear Detection Log',
      'Are you sure you want to clear all log entries?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearDetectionLog();
            setLog([]);
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTypeIcon = (type: DetectionLogEntry['type']) => {
    switch (type) {
      case 'eye_closure':
        return '👁';
      case 'blink_rate':
        return '👀';
      case 'yawn':
        return '🥱';
      case 'combined':
        return '⚠️';
      case 'face_lost':
        return '❓';
      default:
        return '📋';
    }
  };

  const getWarningColor = (level: 'mild' | 'severe') => {
    return level === 'severe' ? COLORS.danger : COLORS.warning;
  };

  const renderItem = ({ item }: { item: DetectionLogEntry }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.logIcon}>{getTypeIcon(item.type)}</Text>
        <Text style={styles.logType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getWarningColor(item.warningLevel) },
          ]}
        >
          <Text style={styles.severityText}>{item.warningLevel}</Text>
        </View>
      </View>
      <Text style={styles.logDetails}>{item.details}</Text>
      <View style={styles.logMeta}>
        <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
        {item.earValue !== undefined && (
          <Text style={styles.logMetaText}>EAR: {item.earValue.toFixed(2)}</Text>
        )}
        {item.marValue !== undefined && (
          <Text style={styles.logMetaText}>MAR: {item.marValue.toFixed(2)}</Text>
        )}
        {item.speed !== undefined && (
          <Text style={styles.logMetaText}>{item.speed} mph</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detection Log</Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {log.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No detection events recorded yet</Text>
          <Text style={styles.emptySubtext}>
            Events will appear here when drowsiness is detected during monitoring.
          </Text>
        </View>
      ) : (
        <FlatList
          data={log}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    width: 70,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearButton: {
    width: 70,
    alignItems: 'flex-end',
  },
  clearText: {
    color: COLORS.danger,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  logItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logType: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.background,
    textTransform: 'uppercase',
  },
  logDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  logMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  logTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  logMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
