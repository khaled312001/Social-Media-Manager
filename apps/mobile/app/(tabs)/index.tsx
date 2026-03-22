import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { analyticsApi } from '../../src/lib/api';

function KpiCard({ label, value, change }: { label: string; value: string; change: number }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={[styles.kpiChange, { color: change >= 0 ? '#22c55e' : '#ef4444' }]}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </Text>
    </View>
  );
}

export default function OverviewScreen() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    analyticsApi.getOverview({ period: '30d' })
      .then((r: any) => setOverview(r?.data ?? r))
      .catch(() => {});
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.subheading}>Last 30 days</Text>

      <View style={styles.kpiRow}>
        <KpiCard label="Reach" value={fmt(overview?.totalReach ?? 0)} change={overview?.reachChange ?? 0} />
        <KpiCard label="Engagement" value={fmt(overview?.totalEngagement ?? 0)} change={overview?.engagementChange ?? 0} />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard label="Followers" value={fmt(overview?.totalFollowers ?? 0)} change={overview?.followersChange ?? 0} />
        <KpiCard label="Messages" value={fmt(overview?.totalMessages ?? 0)} change={overview?.messagesChange ?? 0} />
      </View>

      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>Create New Post</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subheading: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  kpiLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  kpiChange: { fontSize: 12, marginTop: 2 },
  ctaButton: {
    backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
