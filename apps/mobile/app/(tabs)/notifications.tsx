import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { notificationsApi } from '../../src/lib/api';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list()
      .then((r: any) => setNotifications(r?.data ?? r ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = (id: string) => {
    notificationsApi.markAsRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#8b5cf6" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => markRead(item.id)}
          >
            {!item.isRead && <View style={styles.unreadDot} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
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
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#8b5cf6' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#8b5cf6', marginTop: 4,
  },
  title: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  message: { fontSize: 12, color: '#64748b', lineHeight: 17 },
  time: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
});
