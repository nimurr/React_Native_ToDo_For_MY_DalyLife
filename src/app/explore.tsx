import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <ThemedText type="smallBold" style={styles.heroBadgeText}>
                Weekly overview
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Calm, focused, and ready.
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtitle}>
              A polished snapshot of your priorities, work rhythm, and personal balance.
            </ThemedText>
          </View>

          <View style={styles.grid}>
            <View style={styles.statCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                Focus today
              </ThemedText>
              <ThemedText type="title" style={styles.statNumber}>
                6
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                important tasks ready
              </ThemedText>
            </View>

            <View style={styles.statCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                Meetings
              </ThemedText>
              <ThemedText type="title" style={styles.statNumber}>
                3
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                this week
              </ThemedText>
            </View>
          </View>

          <View style={styles.panelCard}>
            <ThemedText type="subtitle" style={styles.panelTitle}>
              Smart plan
            </ThemedText>
            <View style={styles.listItem}>
              <ThemedText type="smallBold" style={styles.panelText}>
                • Review university deadlines in the morning
              </ThemedText>
            </View>
            <View style={styles.listItem}>
              <ThemedText type="smallBold" style={styles.panelText}>
                • Finish office follow-up before 6 PM
              </ThemedText>
            </View>
            <View style={styles.listItem}>
              <ThemedText type="smallBold" style={styles.panelText}>
                • Check personal budget after dinner
              </ThemedText>
            </View>
          </View>

          <View style={styles.panelCardDark}>
            <ThemedText type="subtitle" style={styles.panelTitleDark}>
              Quick notes
            </ThemedText>
            <ThemedText type="small" style={styles.mutedTextDark}>
              Keep this workspace simple and private. All entries are stored locally and stay on your device.
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.two,
  },
  heroCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  heroBadgeText: {
    color: '#2563eb',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: '#0f172a',
  },
  heroSubtitle: {
    color: '#64748b',
    maxWidth: 560,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardLabel: {
    color: '#64748b',
  },
  statNumber: {
    fontSize: 28,
    lineHeight: 32,
    color: '#0f172a',
  },
  mutedText: {
    color: '#64748b',
  },
  panelCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  panelCardDark: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.one,
    backgroundColor: '#0f172a',
  },
  panelTitle: {
    color: '#111827',
  },
  panelTitleDark: {
    color: '#f8fafc',
  },
  listItem: {
    paddingVertical: Spacing.one,
  },
  panelText: {
    color: '#334155',
  },
  mutedTextDark: {
    color: '#cbd5e1',
  },
});
