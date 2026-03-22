import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { analyticsApi } from '../../src/lib/api';

const PERIODS = ['7d', '30d', '90d'] as const;

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.getOverview({ period })
      .then((r: any) => setData(r?.data ?? r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const metrics = [
    { label: 'Total Reach', value: fmt(data?.totalReach ?? 0), change: data?.reachChange ?? 0 },
    { label: 'Engagement', value: fmt(data?.totalEngagement ?? 0), change: data?.engagementChange ?? 0 },
    { label: 'New Followers', value: fmt(data?.newFollowers ?? 0), change: data?.followersChange ?? 0 },
    { label: 'Posts Published', value: fmt(data?.postsPublished ?? 0), change: 0 },
    { label: 'Avg Eng. Rate', value: `${(data?.avgEngagementRate ?? 0).toFixed(1)}%`, change: data?.engRateChange ?? 0 },
    { label: 'Link Clicks', value: fmt(data?.totalClicks ?? 0), change: data?.clicksChange ?? 0 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Analytics</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#8b5cf6" />
        </View>
      ) : (
        <View style={styles.grid}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              {m.change !== 0 && (
                <Text style={[styles.metricChange, { color: m.change >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {m.change >= 0 ? '↑' : '↓'} {Math.abs(m.change)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Platform breakdown placeholder */}
      <Text style={styles.sectionTitle}>Platform Breakdown</Text>
      {(['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN'] as const).map((platform) => {
        const platformData = data?.platformBreakdown?.[platform];
        const value = platformData?.reach ?? 0;
        const pct = data?.totalReach > 0 ? (value / data.totalReach) * 100 : 25;
        const colors: Record<string, string> = {
          FACEBOOK: '#1877F2', INSTAGRAM: '#E1306C', TWITTER: '#1DA1F2', LINKEDIN: '#0A66C2',
        };
        return (
          <View key={platform} style={styles.platformRow}>
            <Text style={styles.platformLabel}>{platform}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors[platform] }]} />
            </View>
            <Text style={styles.platformValue}>{fmt(value)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 14 },
  heading: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  centered: { paddingVertical: 40, alignItems: 'center' },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  periodBtnActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  periodText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  metricLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  metricChange: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  platformRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platformLabel: { width: 80, fontSize: 12, color: '#374151', fontWeight: '500' },
  barTrack: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  platformValue: { width: 40, fontSize: 11, color: '#64748b', textAlign: 'right' },
});
