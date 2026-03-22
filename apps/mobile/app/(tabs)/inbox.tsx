import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { inboxApi } from '../../src/lib/api';

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: '#22c55e',
  NEUTRAL: '#94a3b8',
  NEGATIVE: '#ef4444',
};

export default function InboxScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ASSIGNED'>('ALL');

  useEffect(() => {
    inboxApi.list({ status: filter === 'ALL' ? undefined : filter, limit: 30 })
      .then((r: any) => {
        const data = r?.data ?? r;
        setMessages(data?.items ?? data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.tabs}>
        {(['ALL', 'UNREAD', 'ASSIGNED'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.messageCard}>
            <View style={styles.messageLeft}>
              <View
                style={[styles.platformDot, { backgroundColor: PLATFORM_COLORS[item.platform] ?? '#888' }]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName} numberOfLines={1}>{item.authorName}</Text>
                <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
              </View>
            </View>
            <View style={styles.messageRight}>
              {item.sentiment && (
                <View style={[styles.sentimentDot, { backgroundColor: SENTIMENT_COLORS[item.sentiment] }]} />
              )}
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
  tabText: { fontSize: 13, color: '#64748b' },
  tabTextActive: { color: '#8b5cf6', fontWeight: '600' },
  messageCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  messageLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  platformDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  authorName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  content: { fontSize: 12, color: '#64748b', marginTop: 2 },
  messageRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  sentimentDot: { width: 6, height: 6, borderRadius: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8b5cf6' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
