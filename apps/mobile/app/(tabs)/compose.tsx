import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { postsApi } from '../../src/lib/api';

const PLATFORMS = [
  { key: 'TWITTER', label: 'Twitter', color: '#1DA1F2', limit: 280 },
  { key: 'INSTAGRAM', label: 'Instagram', color: '#E1306C', limit: 2200 },
  { key: 'FACEBOOK', label: 'Facebook', color: '#1877F2', limit: 63206 },
  { key: 'LINKEDIN', label: 'LinkedIn', color: '#0A66C2', limit: 3000 },
  { key: 'TIKTOK', label: 'TikTok', color: '#010101', limit: 2200 },
];

export default function ComposeScreen() {
  const [content, setContent] = useState('');
  const [selected, setSelected] = useState<string[]>(['TWITTER', 'INSTAGRAM']);
  const [loading, setLoading] = useState(false);

  const selectedLimits = PLATFORMS.filter((p) => selected.includes(p.key));
  const minLimit = selectedLimits.length > 0 ? Math.min(...selectedLimits.map((p) => p.limit)) : 280;
  const overLimit = content.length > minLimit;

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handlePublish = async (scheduleNow = true) => {
    if (!content.trim()) return Alert.alert('Error', 'Please enter some content');
    if (selected.length === 0) return Alert.alert('Error', 'Select at least one platform');
    setLoading(true);
    try {
      await postsApi.create({ content, platforms: selected, status: scheduleNow ? 'PUBLISHED' : 'DRAFT' });
      Alert.alert('Success', scheduleNow ? 'Post published!' : 'Draft saved');
      setContent('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Compose Post</Text>

      {/* Platform toggles */}
      <Text style={styles.label}>Platforms</Text>
      <View style={styles.platformRow}>
        {PLATFORMS.map((p) => {
          const isOn = selected.includes(p.key);
          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => toggle(p.key)}
              style={[styles.platformChip, isOn && { backgroundColor: p.color, borderColor: p.color }]}
            >
              <Text style={[styles.platformChipText, isOn && { color: '#fff' }]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <Text style={styles.label}>Content</Text>
      <TextInput
        style={[styles.textArea, overLimit && styles.textAreaError]}
        multiline
        numberOfLines={6}
        placeholder="What do you want to share?"
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, overLimit && { color: '#ef4444' }]}>
        {content.length} / {minLimit}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => handlePublish(false)}
          disabled={loading}
        >
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, overLimit && styles.publishBtnDisabled]}
          onPress={() => handlePublish(true)}
          disabled={loading || overLimit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.publishBtnText}>Publish Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  platformChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  textArea: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 12, fontSize: 15, color: '#0f172a', minHeight: 120,
  },
  textAreaError: { borderColor: '#ef4444' },
  charCount: { fontSize: 12, color: '#94a3b8', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  draftBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#fff', padding: 14, alignItems: 'center',
  },
  draftBtnText: { fontWeight: '600', color: '#374151' },
  publishBtn: {
    flex: 2, backgroundColor: '#8b5cf6', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  publishBtnDisabled: { backgroundColor: '#c4b5fd' },
  publishBtnText: { fontWeight: '600', color: '#fff', fontSize: 15 },
});
