import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type PlannerSection = 'university' | 'office' | 'personal';
type PlannerItemType = 'task' | 'meeting' | 'reminder' | 'exam' | 'expense' | 'income';

type PlannerItem = {
  id: string;
  section: PlannerSection;
  title: string;
  details: string;
  dueDate: string;
  completed: boolean;
  type: PlannerItemType;
  amount: string;
};

type SectionMeta = {
  label: string;
  subtitle: string;
  accent: [string, string];
  typeOptions: Array<{ label: string; value: PlannerItemType }>;
};

const storageKey = 'personal-planner-v1';

const sectionMeta: Record<PlannerSection, SectionMeta> = {
  university: {
    label: 'University',
    subtitle: 'Study plans, deadlines, and course work',
    accent: ['#2563eb', '#4f46e5'],
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Exam', value: 'exam' },
      { label: 'Reminder', value: 'reminder' },
    ],
  },
  office: {
    label: 'Office',
    subtitle: 'Meetings, work blocks, and follow-ups',
    accent: ['#7c3aed', '#4338ca'],
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Meeting', value: 'meeting' },
      { label: 'Reminder', value: 'reminder' },
    ],
  },
  personal: {
    label: 'Personal',
    subtitle: 'Life notes and money management',
    accent: ['#0f766e', '#14b8a6'],
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Expense', value: 'expense' },
      { label: 'Income', value: 'income' },
    ],
  },
};

const createEmptyDraft = (section: PlannerSection) => ({
  section,
  title: '',
  details: '',
  dueDate: '',
  amount: '',
  type: sectionMeta[section].typeOptions[0].value as PlannerItemType,
});

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default function HomeScreen() {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<PlannerSection>('university');
  const [draft, setDraft] = useState(createEmptyDraft('university'));
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as PlannerItem[];
          setItems(parsed);
        }
      } catch (error) {
        console.warn('Unable to load planner data', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch((error) => {
        console.warn('Unable to save planner data', error);
      });
    }
  }, [items, loading]);

  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => item.section === activeSection)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));
  }, [activeSection, items]);

  const sectionSummary = useMemo(() => {
    const sectionItems = items.filter((item) => item.section === activeSection);
    const completed = sectionItems.filter((item) => item.completed).length;
    const pending = sectionItems.length - completed;
    const amounts = sectionItems
      .filter((item) => item.section === 'personal' && item.amount)
      .map((item) => Number(item.amount));
    const income = amounts.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
    const expense = Math.abs(amounts.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0));

    return { completed, pending, income, expense };
  }, [activeSection, items]);

  const resetForm = () => {
    setDraft(createEmptyDraft(activeSection));
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      Alert.alert('Need a title', 'Please add a short title before saving.');
      return;
    }

    const normalizedAmount = draft.amount.trim();
    if (draft.section === 'personal' && draft.type !== 'task' && !normalizedAmount) {
      Alert.alert('Need an amount', 'Please add a value for this money entry.');
      return;
    }

    const payload: PlannerItem = {
      id: editingId ?? `${Date.now()}`,
      section: draft.section,
      title: draft.title.trim(),
      details: draft.details.trim(),
      dueDate: draft.dueDate || getTodayString(),
      completed: editingId ? items.find((item) => item.id === editingId)?.completed ?? false : false,
      type: draft.type,
      amount: draft.section === 'personal' && draft.type !== 'task' ? normalizedAmount : '',
    };

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? payload : item)));
    } else {
      setItems((current) => [payload, ...current]);
    }

    resetForm();
  };

  const beginEdit = (item: PlannerItem) => {
    setEditingId(item.id);
    setActiveSection(item.section);
    setDraft({
      section: item.section,
      title: item.title,
      details: item.details,
      dueDate: item.dueDate,
      amount: item.amount,
      type: item.type,
    });
  };

  const toggleComplete = (itemId: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
    );
  };

  const deleteItem = (itemId: string) => {
    Alert.alert('Delete this item?', 'This will remove it from your planner.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems((current) => current.filter((item) => item.id !== itemId)),
      },
    ]);
  };

  const currentMeta = sectionMeta[activeSection];

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText type="subtitle">Loading planner…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText type="title" style={styles.heroTitle}>
              Personal Planner
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtitle}>
              Keep university priorities, office work, and personal finance in one calm, private place.
            </ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                {currentMeta.label}
              </ThemedText>
              <ThemedText type="title" style={styles.summaryNumber}>
                {sectionSummary.pending}
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                pending items
              </ThemedText>
            </View>

            <View style={styles.summaryCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                Completed
              </ThemedText>
              <ThemedText type="title" style={styles.summaryNumber}>
                {sectionSummary.completed}
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                checked off
              </ThemedText>
            </View>

            {activeSection === 'personal' ? (
              <View style={styles.summaryCard}>
                <ThemedText type="smallBold" style={styles.cardLabel}>
                  Cash flow
                </ThemedText>
                <ThemedText type="title" style={styles.summaryNumber}>
                  {sectionSummary.income - sectionSummary.expense >= 0 ? '+' : '-'}
                  {Math.abs(sectionSummary.income - sectionSummary.expense).toFixed(0)}
                </ThemedText>
                <ThemedText type="small" style={styles.mutedText}>
                  income minus expenses
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionSwitch}>
            {(Object.keys(sectionMeta) as PlannerSection[]).map((section) => {
              const meta = sectionMeta[section];
              const selected = activeSection === section;
              return (
                <Pressable
                  key={section}
                  onPress={() => {
                    setActiveSection(section);
                    setDraft(createEmptyDraft(section));
                    setEditingId(null);
                  }}
                  style={({ pressed }) => [
                    styles.sectionButton,
                    selected && { backgroundColor: meta.accent[0], borderColor: meta.accent[0] },
                    pressed && styles.sectionButtonPressed,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={[styles.sectionButtonText, selected && styles.sectionButtonTextSelected]}>
                    {meta.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <ThemedText type="smallBold" style={styles.formTitle}>
              {editingId ? 'Update' : 'Add'} {currentMeta.label} item
            </ThemedText>
            <ThemedText type="small" style={styles.formSubtitle}>
              {currentMeta.subtitle}
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Enter title"
              placeholderTextColor="#64748b"
              value={draft.title}
              onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details or notes"
              placeholderTextColor="#64748b"
              multiline
              value={draft.details}
              onChangeText={(value) => setDraft((current) => ({ ...current, details: value }))}
            />

            <View style={styles.formRow}>
              <View style={styles.formCell}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  Due date
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                  value={draft.dueDate}
                  onChangeText={(value) => setDraft((current) => ({ ...current, dueDate: value }))}
                />
              </View>

              <View style={styles.formCell}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  {activeSection === 'personal' ? 'Amount' : 'Tag'}
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder={activeSection === 'personal' ? '120 or -50' : 'Optional'}
                  placeholderTextColor="#64748b"
                  value={draft.amount}
                  onChangeText={(value) => setDraft((current) => ({ ...current, amount: value }))}
                />
              </View>
            </View>

            <View style={styles.typeRow}>
              {currentMeta.typeOptions.map((option) => {
                const selected = draft.type === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraft((current) => ({ ...current, type: option.value }))}
                    style={({ pressed }) => [
                      styles.typeChip,
                      selected && { backgroundColor: currentMeta.accent[0] },
                      pressed && styles.sectionButtonPressed,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                <ThemedText type="smallBold" style={styles.primaryButtonText}>
                  {editingId ? 'Save changes' : 'Add item'}
                </ThemedText>
              </Pressable>
              {editingId ? (
                <Pressable style={styles.secondaryButton} onPress={resetForm}>
                  <ThemedText type="smallBold" style={styles.secondaryButtonText}>
                    Cancel
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <ThemedText type="subtitle" style={styles.listTitle}>
                {currentMeta.label} list
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                {visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}
              </ThemedText>
            </View>

            {visibleItems.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText type="smallBold" style={styles.emptyStateTitle}>
                  No items yet
                </ThemedText>
                <ThemedText type="small" style={styles.mutedText}>
                  Add your first task to start building your local planner.
                </ThemedText>
              </View>
            ) : (
              visibleItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <Pressable onPress={() => toggleComplete(item.id)} style={styles.checkButton}>
                      <ThemedText type="smallBold" style={styles.checkButtonText}>
                        {item.completed ? '✓' : '○'}
                      </ThemedText>
                    </Pressable>
                    <View style={styles.itemContent}>
                      <ThemedText type="smallBold" style={item.completed ? styles.completedText : styles.itemTitle}>
                        {item.title}
                      </ThemedText>
                      <ThemedText type="small" style={styles.mutedText}>
                        {item.details || 'No details added'}
                      </ThemedText>
                      <ThemedText type="small" style={styles.mutedText}>
                        {item.dueDate} • {item.type}
                        {item.amount ? ` • ${item.amount}` : ''}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <Pressable onPress={() => beginEdit(item)} style={styles.actionLink}>
                      <ThemedText type="smallBold" style={styles.actionLinkText}>
                        Edit
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => deleteItem(item.id)} style={styles.actionLink}>
                      <ThemedText type="smallBold" style={styles.actionLinkText}>
                        Delete
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
  heroTitle: {
    fontSize: 32,
    lineHeight: 36,
    color: '#0f172a',
  },
  heroSubtitle: {
    maxWidth: 560,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryCard: {
    flex: 1,
    minWidth: 160,
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
  summaryNumber: {
    fontSize: 28,
    lineHeight: 32,
    color: '#0f172a',
  },
  mutedText: {
    color: '#64748b',
  },
  sectionSwitch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.one,
  },
  sectionButton: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#f8fbff',
  },
  sectionButtonPressed: {
    opacity: 0.85,
  },
  sectionButtonText: {
    color: '#334155',
  },
  sectionButtonTextSelected: {
    color: '#ffffff',
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    color: '#0f172a',
  },
  formSubtitle: {
    marginBottom: Spacing.one,
    color: '#64748b',
  },
  fieldLabel: {
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3ec',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 44,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formCell: {
    flex: 1,
    gap: Spacing.one,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe3ec',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: '#f8fafc',
  },
  typeChipText: {
    color: '#0f172a',
  },
  typeChipTextSelected: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  primaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe3ec',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#0f172a',
  },
  listCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 22,
    color: '#0f172a',
  },
  emptyState: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#f8fafc',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateTitle: {
    color: '#0f172a',
  },
  itemCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemTopRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkButtonText: {
    color: '#0f172a',
  },
  itemContent: {
    flex: 1,
    gap: Spacing.one,
  },
  itemTitle: {
    color: '#0f172a',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
    color: '#64748b',
  },
  itemActions: {
    marginLeft: 40,
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionLink: {
    paddingVertical: Spacing.one,
  },
  actionLinkText: {
    color: '#2563eb',
  },
});
