import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f172a', '#111827']} style={styles.backgroundGradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#2563eb', '#7c3aed']} style={styles.heroCard}>
            <ThemedText type="title" style={styles.heroTitle}>
              Weekly overview
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtitle}>
              A calm snapshot of your priorities, work rhythm, and personal balance.
            </ThemedText>
          </LinearGradient>

          <View style={styles.grid}>
            <LinearGradient colors={['#111827', '#1f2937']} style={styles.statCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                Focus today
              </ThemedText>
              <ThemedText type="title" style={styles.statNumber}>
                6
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                important tasks ready
              </ThemedText>
            </LinearGradient>

            <LinearGradient colors={['#111827', '#1f2937']} style={styles.statCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                Meetings
              </ThemedText>
              <ThemedText type="title" style={styles.statNumber}>
                3
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                this week
              </ThemedText>
            </LinearGradient>
          </View>

          <LinearGradient colors={['#f8fafc', '#eef2ff']} style={styles.panelCard}>
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
          </LinearGradient>

          <LinearGradient colors={['#111827', '#0f172a']} style={styles.panelCardDark}>
            <ThemedText type="subtitle" style={styles.panelTitleDark}>
              Quick notes
            </ThemedText>
            <ThemedText type="small" style={styles.mutedText}>
              Keep this workspace simple and private. All entries are stored locally and stay on your device.
            </ThemedText>
          </LinearGradient>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  backgroundGradient: {
    flex: 1,
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
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: '#ffffff',
  },
  heroSubtitle: {
    color: '#e2e8f0',
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
  },
  cardLabel: {
    color: '#e2e8f0',
  },
  statNumber: {
    fontSize: 28,
    lineHeight: 32,
    color: '#ffffff',
  },
  mutedText: {
    color: '#94a3b8',
  },
  panelCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  panelCardDark: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.one,
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
});
