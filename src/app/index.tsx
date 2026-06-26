import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
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
  accent: string;
  typeOptions: Array<{ label: string; value: PlannerItemType }>;
};

const storageKey = 'personal-planner-v1';

const sectionMeta: Record<PlannerSection, SectionMeta> = {
  university: {
    label: 'University',
    subtitle: 'Classes, deadlines, and study notes',
    accent: '#2563eb',
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Exam', value: 'exam' },
      { label: 'Reminder', value: 'reminder' },
    ],
  },
  office: {
    label: 'Office',
    subtitle: 'Work blocks, meetings, and follow-ups',
    accent: '#7c3aed',
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Meeting', value: 'meeting' },
      { label: 'Reminder', value: 'reminder' },
    ],
  },
  personal: {
    label: 'Personal',
    subtitle: 'Daily life notes and money tracking',
    accent: '#0f766e',
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
      completed: editingId
        ? items.find((item) => item.id === editingId)?.completed ?? false
        : false,
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedView type="backgroundElement" style={styles.heroCard}>
          <ThemedText type="title" style={styles.heroTitle}>
            Personal Planner
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heroSubtitle}>
            Keep your university tasks, office work, and personal money life organized in one private
            local workspace.
          </ThemedText>
        </ThemedView>

        <View style={styles.summaryRow}>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold">{currentMeta.label}</ThemedText>
            <ThemedText type="title" style={styles.summaryNumber}>
              {sectionSummary.pending}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              pending items
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold">Completed</ThemedText>
            <ThemedText type="title" style={styles.summaryNumber}>
              {sectionSummary.completed}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              checked off
            </ThemedText>
          </ThemedView>

          {activeSection === 'personal' ? (
            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <ThemedText type="smallBold">Cash flow</ThemedText>
              <ThemedText type="title" style={styles.summaryNumber}>
                {sectionSummary.income - sectionSummary.expense >= 0 ? '+' : '-'}
                {Math.abs(sectionSummary.income - sectionSummary.expense).toFixed(0)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                income minus expenses
              </ThemedText>
            </ThemedView>
          ) : null}
        </View>

        <ThemedView type="backgroundElement" style={styles.sectionSwitch}>
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
                  selected && { backgroundColor: meta.accent, borderColor: meta.accent },
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
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.formCard}>
          <ThemedText type="smallBold" style={styles.formTitle}>
            {editingId ? 'Update' : 'Add'} {currentMeta.label} item
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.formSubtitle}>
            {currentMeta.subtitle}
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Enter title"
            placeholderTextColor="#8a8a8a"
            value={draft.title}
            onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details or notes"
            placeholderTextColor="#8a8a8a"
            multiline
            value={draft.details}
            onChangeText={(value) => setDraft((current) => ({ ...current, details: value }))}
          />

          <View style={styles.formRow}>
            <View style={styles.formCell}>
              <ThemedText type="small" themeColor="textSecondary">
                Due date
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8a8a8a"
                value={draft.dueDate}
                onChangeText={(value) => setDraft((current) => ({ ...current, dueDate: value }))}
              />
            </View>

            <View style={styles.formCell}>
              <ThemedText type="small" themeColor="textSecondary">
                {activeSection === 'personal' ? 'Amount' : 'Tag'}
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder={activeSection === 'personal' ? '120 or -50' : 'Optional'}
                placeholderTextColor="#8a8a8a"
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
                    selected && { backgroundColor: currentMeta.accent },
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
                <ThemedText type="smallBold">Cancel</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.listCard}>
          <View style={styles.listHeader}>
            <ThemedText type="subtitle" style={styles.listTitle}>
              {currentMeta.label} list
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}
            </ThemedText>
          </View>

          {visibleItems.length === 0 ? (
            <ThemedView type="background" style={styles.emptyState}>
              <ThemedText type="smallBold">No items yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Add your first task to start building your local planner.
              </ThemedText>
            </ThemedView>
          ) : (
            visibleItems.map((item) => (
              <ThemedView key={item.id} type="background" style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <Pressable onPress={() => toggleComplete(item.id)} style={styles.checkButton}>
                    <ThemedText type="smallBold">{item.completed ? '✓' : '○'}</ThemedText>
                  </Pressable>
                  <View style={styles.itemContent}>
                    <ThemedText type="smallBold" style={item.completed ? styles.completedText : null}>
                      {item.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.details || 'No details added'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
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
              </ThemedView>
            ))
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Platform.OS === 'web' ? Spacing.five : Spacing.four,
  },
  scrollContent: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 36,
  },
  heroSubtitle: {
    maxWidth: 560,
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
  },
  summaryNumber: {
    fontSize: 28,
    lineHeight: 32,
  },
  sectionSwitch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  sectionButton: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sectionButtonPressed: {
    opacity: 0.8,
  },
  sectionButtonText: {
    color: '#111827',
  },
  sectionButtonTextSelected: {
    color: '#ffffff',
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  formTitle: {
    fontSize: 20,
  },
  formSubtitle: {
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 44,
    color: '#111827',
    backgroundColor: '#ffffff',
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
    borderColor: '#d1d5db',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  typeChipText: {
    color: '#111827',
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
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  listCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 22,
  },
  emptyState: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  itemCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
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
  },
  itemContent: {
    flex: 1,
    gap: Spacing.one,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
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
